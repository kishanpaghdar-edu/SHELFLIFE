const db = require('../config/db');

/* ── POST /api/orders — place order (deducts inventory) ── */
async function placeOrder(req, res) {
  const { items, delivery_address, payment_method } = req.body;
  if (!items || !items.length)
    return res.status(400).json({ message: 'items array is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let totalAmount = 0, originalAmount = 0, co2Saved = 0, restaurantId = null;
    const itemDetails = []; // store for order_items insert

    for (const item of items) {
      const [rows] = await conn.query(
        'SELECT * FROM food_items WHERE id = ? AND is_active = 1 FOR UPDATE',
        [item.food_item_id]
      );
      if (!rows.length) throw new Error(`Item ${item.food_item_id} not found`);
      const fi = rows[0];
      if (fi.quantity < item.quantity)
        throw new Error(`Not enough stock for "${fi.name}". Only ${fi.quantity} left.`);

      await conn.query(
        'UPDATE food_items SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, fi.id]
      );

      totalAmount    += parseFloat(fi.discount_price)    * item.quantity;
      originalAmount += parseFloat(fi.original_price)    * item.quantity;
      co2Saved       += parseFloat(fi.weight_kg || 0.25) * item.quantity * 2.5;
      restaurantId    = fi.restaurant_id;

      itemDetails.push({
        food_item_id:   fi.id,
        quantity:       item.quantity,
        unit_price:     fi.discount_price,
        original_price: fi.original_price,  // ← NEW: store original for analytics
        category:       fi.category,        // ← NEW: store category for charts
        weight_kg:      fi.weight_kg || 0.25, // ← NEW: store weight for CO2 by category
      });
    }

    const savedAmount = originalAmount - totalAmount;
    const deliveryFee = totalAmount > 199 ? 0 : 30;
    totalAmount += deliveryFee;

    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (user_id, restaurant_id, total_amount, original_amount, saved_amount,
          co2_saved_kg, delivery_address, payment_method, status)
       VALUES (?,?,?,?,?,?,?,?,'pending')`,
      [
        req.user.id, restaurantId,
        totalAmount.toFixed(2), originalAmount.toFixed(2),
        savedAmount.toFixed(2), co2Saved.toFixed(3),
        delivery_address || null, payment_method || null,
      ]
    );
    const orderId = orderResult.insertId;

    // Insert order_items with category + weight + original_price copied at order time
    for (const it of itemDetails) {
      await conn.query(
        `INSERT INTO order_items
           (order_id, food_item_id, quantity, unit_price, original_price, category, weight_kg)
         VALUES (?,?,?,?,?,?,?)`,
        [orderId, it.food_item_id, it.quantity, it.unit_price,
         it.original_price, it.category, it.weight_kg]
      );
    }

    await conn.commit();
    res.status(201).json({
      order_id:     orderId,
      total_amount: totalAmount.toFixed(2),
      saved_amount: savedAmount.toFixed(2),
      co2_saved_kg: co2Saved.toFixed(3),
      message:      'Order placed successfully',
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(400).json({ message: err.message || 'Order failed' });
  } finally {
    conn.release();
  }
}

/* ── GET /api/orders/my — user's order history ── */
async function getUserOrders(req, res) {
  try {
    const [orders] = await db.query(
      `SELECT o.*, r.restaurant_name, o.payment_status, o.razorpay_payment_id
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, fi.name, fi.category, fi.is_veg, fi.image_url
         FROM order_items oi
         JOIN food_items fi ON oi.food_item_id = fi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/orders/impact — user's total CO2 & savings ── */
async function getUserImpact(req, res) {
  try {
    // Try the cached stats table first (faster)
    const [cached] = await db.query(
      'SELECT * FROM user_impact_stats WHERE user_id = ?',
      [req.user.id]
    );

    if (cached.length && cached[0].total_orders > 0) {
      return res.json({
        total_orders: cached[0].total_orders,
        total_saved:  parseFloat(cached[0].total_saved_inr).toFixed(2),
        total_co2:    parseFloat(cached[0].total_co2_kg).toFixed(3),
        tree_years:   parseFloat(cached[0].tree_years).toFixed(3),
      });
    }

    // Fallback: compute live from orders
    const [[stats]] = await db.query(
      `SELECT
         COUNT(*)                           AS total_orders,
         COALESCE(SUM(saved_amount),  0)    AS total_saved,
         COALESCE(SUM(co2_saved_kg),  0)    AS total_co2,
         COALESCE(SUM(co2_saved_kg)/21, 0)  AS tree_years
       FROM orders
       WHERE user_id = ? AND status != 'cancelled'`,
      [req.user.id]
    );

    // Update cache
    await db.query(
      `INSERT INTO user_impact_stats
         (user_id, total_orders, total_co2_kg, total_saved_inr, tree_years)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         total_orders    = VALUES(total_orders),
         total_co2_kg    = VALUES(total_co2_kg),
         total_saved_inr = VALUES(total_saved_inr),
         tree_years      = VALUES(tree_years)`,
      [
        req.user.id,
        stats.total_orders,
        parseFloat(stats.total_co2).toFixed(3),
        parseFloat(stats.total_saved).toFixed(2),
        parseFloat(stats.tree_years).toFixed(3),
      ]
    );

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/owner/orders — owner sees all customer orders ── */
async function getOwnerOrders(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });

    const [orders] = await db.query(
      `SELECT
         o.*,
         u.name  AS customer_name,
         u.email AS customer_email,
         u.phone AS customer_phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.restaurant_id = ?
       ORDER BY o.created_at DESC`,
      [rest[0].id]
    );

    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, fi.name, fi.category, fi.image_url
         FROM order_items oi
         JOIN food_items fi ON oi.food_item_id = fi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── PUT /api/orders/:id/status ── */
async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const allowed = ['pending','confirmed','preparing','ready','delivered','cancelled'];
  if (!allowed.includes(status))
    return res.status(400).json({ message: 'Invalid status value' });

  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    // When an order is delivered, update user impact stats cache
    if (status === 'delivered') {
      const [[order]] = await db.query(
        'SELECT user_id, co2_saved_kg, saved_amount FROM orders WHERE id = ?',
        [req.params.id]
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
            parseFloat(order.co2_saved_kg).toFixed(3),
            parseFloat(order.saved_amount).toFixed(2),
            (parseFloat(order.co2_saved_kg) / 21).toFixed(3),
          ]
        );
      }
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { placeOrder, getUserOrders, getUserImpact, getOwnerOrders, updateOrderStatus };
