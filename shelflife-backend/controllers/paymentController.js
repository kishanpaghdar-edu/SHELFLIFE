const Razorpay = require('razorpay');
const crypto   = require('crypto');
const db       = require('../config/db');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── POST /api/payment/create-order ── */
async function createRazorpayOrder(req, res) {
  const { amount_paise, order_id } = req.body;
  if (!amount_paise || !order_id)
    return res.status(400).json({ message: 'amount_paise and order_id are required' });

  try {
    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(amount_paise),
      currency: 'INR',
      receipt:  `sl_order_${order_id}`,
      notes:    { shelflife_order_id: order_id },
    });

    // Save razorpay order id to orders table
    await db.query(
      'UPDATE orders SET razorpay_order_id = ?, payment_status = ? WHERE id = ?',
      [rzpOrder.id, 'pending', order_id]
    );

    // Fetch restaurant_id from order for transaction log
    const [[order]] = await db.query(
      'SELECT restaurant_id FROM orders WHERE id = ?',
      [order_id]
    );

    // Log in payment_transactions (correct table name)
    await db.query(
      `INSERT INTO payment_transactions
         (order_id, user_id, restaurant_id, amount, razorpay_order_id, status)
       VALUES (?,?,?,?,?,'created')`,
      [order_id, req.user.id, order.restaurant_id, amount_paise / 100, rzpOrder.id]
    );

    res.json({
      razorpay_order_id: rzpOrder.id,
      amount:            rzpOrder.amount,
      currency:          rzpOrder.currency,
      key_id:            process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ message: 'Payment gateway error. Try again.' });
  }
}

/* ── POST /api/payment/verify ── */
async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id)
    return res.status(400).json({ message: 'Missing payment verification fields' });

  try {
    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      await db.query(
        "UPDATE orders SET payment_status = 'failed' WHERE id = ?",
        [order_id]
      );
      await db.query(
        `UPDATE payment_transactions
         SET status = 'failed', razorpay_payment_id = ?, razorpay_signature = ?
         WHERE razorpay_order_id = ?`,
        [razorpay_payment_id, razorpay_signature, razorpay_order_id]
      );
      return res.status(400).json({ message: 'Payment verification failed. Signature mismatch.' });
    }

    // Fetch payment method from Razorpay
    let paymentMethod = 'razorpay';
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      paymentMethod  = payment.method || 'razorpay';
    } catch (_) {}

    // Mark order as paid + confirmed
    await db.query(
      `UPDATE orders
       SET razorpay_payment_id = ?,
           razorpay_signature  = ?,
           payment_status      = 'paid',
           payment_method      = ?,
           status              = 'confirmed'
       WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, paymentMethod, order_id]
    );

    // Update transaction log
    await db.query(
      `UPDATE payment_transactions
       SET razorpay_payment_id = ?,
           razorpay_signature  = ?,
           payment_method      = ?,
           status              = 'paid'
       WHERE razorpay_order_id = ?`,
      [razorpay_payment_id, razorpay_signature, paymentMethod, razorpay_order_id]
    );

    // Update user impact stats cache
    const [[order]] = await db.query(
      'SELECT user_id, co2_saved_kg, saved_amount FROM orders WHERE id = ?',
      [order_id]
    );
    if (order) {
      await db.query(
        `INSERT INTO user_impact_stats
           (user_id, total_orders, total_co2_kg, total_saved_inr, tree_years)
         VALUES (?, 1, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           total_orders    = total_orders    + 1,
           total_co2_kg    = total_co2_kg    + VALUES(total_co2_kg),
           total_saved_inr = total_saved_inr + VALUES(total_saved_inr),
           tree_years      = (total_co2_kg   + VALUES(total_co2_kg)) / 21`,
        [
          order.user_id,
          parseFloat(order.co2_saved_kg || 0).toFixed(3),
          parseFloat(order.saved_amount || 0).toFixed(2),
          (parseFloat(order.co2_saved_kg || 0) / 21).toFixed(3),
        ]
      );
    }

    res.json({ message: 'Payment verified successfully', payment_method: paymentMethod });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ message: 'Server error during payment verification' });
  }
}

/* ── POST /api/payment/cod-confirm ── */
async function confirmCOD(req, res) {
  const { order_id } = req.body;
  if (!order_id) return res.status(400).json({ message: 'order_id required' });

  try {
    await db.query(
      "UPDATE orders SET payment_method = 'cod', payment_status = 'pending', status = 'confirmed' WHERE id = ?",
      [order_id]
    );

    // Log COD in payment_transactions
    const [[order]] = await db.query(
      'SELECT user_id, restaurant_id, total_amount FROM orders WHERE id = ?',
      [order_id]
    );
    if (order) {
      await db.query(
        `INSERT INTO payment_transactions
           (order_id, user_id, restaurant_id, amount, payment_method, status)
         VALUES (?, ?, ?, ?, 'cod', 'created')`,
        [order_id, order.user_id, order.restaurant_id, order.total_amount]
      );
    }

    res.json({ message: 'COD order confirmed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/owner/transactions — owner sees all payment logs ── */
async function getOwnerTransactions(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });

    const [rows] = await db.query(
      `SELECT
         pt.*,
         u.name    AS customer_name,
         u.email   AS customer_email,
         u.phone   AS customer_phone,
         o.total_amount,
         o.saved_amount,
         o.status  AS order_status,
         o.razorpay_payment_id
       FROM payment_transactions pt
       JOIN orders o ON pt.order_id      = o.id
       JOIN users  u ON pt.user_id       = u.id
       WHERE pt.restaurant_id = ?
       ORDER BY pt.created_at DESC`,
      [rest[0].id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createRazorpayOrder, verifyPayment, confirmCOD, getOwnerTransactions };
