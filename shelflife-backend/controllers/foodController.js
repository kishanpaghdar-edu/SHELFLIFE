const db     = require('../config/db');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e5) + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only JPG/PNG/WEBP images allowed'));
  },
});

/* ── GET /api/items — public browse, returns all active items ── */
async function getAllItems(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        fi.*,
        r.restaurant_name,
        r.city,
        r.location   AS restaurant_address,
        r.contact_number,
        r.image_url  AS restaurant_image_url,
        ROUND((fi.original_price - fi.discount_price) / fi.original_price * 100) AS discount_pct,
        ROUND(fi.weight_kg * 2.5, 2) AS co2_per_unit
      FROM food_items fi
      JOIN restaurants r ON fi.restaurant_id = r.id
      WHERE fi.is_active = 1
        AND fi.quantity  > 0
        AND (
          fi.expiry_date IS NULL
          OR fi.expiry_date > CURDATE()
          OR (fi.expiry_date = CURDATE() AND (fi.expiry_time IS NULL OR fi.expiry_time > CURTIME()))
        )
      ORDER BY fi.expiry_date ASC, fi.expiry_time ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/items/:id ── */
async function getItemById(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT fi.*, r.restaurant_name, r.city
       FROM food_items fi
       JOIN restaurants r ON fi.restaurant_id = r.id
       WHERE fi.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/owner/inventory ── */
async function getOwnerInventory(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found. Please contact support.' });

    const [rows] = await db.query(
      'SELECT * FROM food_items WHERE restaurant_id = ? ORDER BY created_at DESC',
      [rest[0].id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/owner/dashboard ── */
async function getOwnerDashboard(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });
    const rid = rest[0].id;

    const [[revenue]]    = await db.query('SELECT COALESCE(SUM(total_amount),0) AS today FROM orders WHERE restaurant_id=? AND DATE(created_at)=CURDATE()', [rid]);
    const [[orderCount]] = await db.query('SELECT COUNT(*) AS count FROM orders WHERE restaurant_id=? AND DATE(created_at)=CURDATE()', [rid]);
    const [[expiring]]   = await db.query('SELECT COUNT(*) AS count FROM food_items WHERE restaurant_id=? AND expiry_date=CURDATE() AND is_active=1', [rid]);
    const [[outOfStock]] = await db.query('SELECT COUNT(*) AS count FROM food_items WHERE restaurant_id=? AND quantity=0', [rid]);
    const [[totalRev]]   = await db.query('SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE restaurant_id=?', [rid]);
    const [[totalOrders]]= await db.query('SELECT COUNT(*) AS count FROM orders WHERE restaurant_id=?', [rid]);

    res.json({
      revenue_today:   parseFloat(revenue.today).toFixed(2),
      orders_today:    orderCount.count,
      expiring_today:  expiring.count,
      out_of_stock:    outOfStock.count,
      total_revenue:   parseFloat(totalRev.total).toFixed(2),
      total_orders:    totalOrders.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── POST /api/owner/items — with optional image upload ── */
async function createItem(req, res) {
  const {
    name, description, category, is_veg,
    original_price, discount_price, quantity,
    unit, weight_kg, expiry_date, expiry_time, ngo_eligible
  } = req.body;

  if (!name || !original_price || !discount_price)
    return res.status(400).json({ message: 'name, original_price and discount_price are required' });

  if (parseFloat(discount_price) >= parseFloat(original_price))
    return res.status(400).json({ message: 'Discounted price must be lower than original price' });

  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });

    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    const [result] = await db.query(
      `INSERT INTO food_items
         (restaurant_id, name, description, category, is_veg, original_price,
          discount_price, quantity, unit, weight_kg, expiry_date, expiry_time,
          image_url, ngo_eligible, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      [
        rest[0].id, name, description || null, category || null,
        is_veg !== undefined ? parseInt(is_veg) : 1,
        parseFloat(original_price), parseFloat(discount_price),
        parseInt(quantity) || 0, unit || 'pieces',
        parseFloat(weight_kg) || 0.25,
        expiry_date || null, expiry_time || null,
        imageUrl,
        ngo_eligible !== undefined ? parseInt(ngo_eligible) : 0,
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Item added successfully', image_url: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── PUT /api/owner/items/:id ── */
async function updateItem(req, res) {
  const {
    name, description, category, is_veg,
    original_price, discount_price, quantity,
    unit, weight_kg, expiry_date, expiry_time, is_active, ngo_eligible
  } = req.body;

  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });

    const [check] = await db.query(
      'SELECT id FROM food_items WHERE id = ? AND restaurant_id = ?',
      [req.params.id, rest[0].id]
    );
    if (!check.length) return res.status(403).json({ message: 'Item not found or not yours' });

    await db.query(
      `UPDATE food_items SET
         name=?, description=?, category=?, is_veg=?,
         original_price=?, discount_price=?, quantity=?,
         unit=?, weight_kg=?, expiry_date=?, expiry_time=?,
         is_active=?, ngo_eligible=?
       WHERE id=?`,
      [
        name, description || null, category || null,
        parseInt(is_veg), parseFloat(original_price), parseFloat(discount_price),
        parseInt(quantity), unit, parseFloat(weight_kg),
        expiry_date || null, expiry_time || null,
        parseInt(is_active ?? 1), parseInt(ngo_eligible ?? 0),
        req.params.id
      ]
    );
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── DELETE /api/owner/items/:id ── */
async function deleteItem(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });

    await db.query(
      'DELETE FROM food_items WHERE id = ? AND restaurant_id = ?',
      [req.params.id, rest[0].id]
    );
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/owner/profile — return restaurant info incl. image ── */
async function getOwnerProfile(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id, restaurant_name, location, city, contact_number, image_url FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(rest[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── PUT /api/owner/profile — update restaurant profile (including image) ── */
async function updateOwnerProfile(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id, image_url FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });

    const { restaurant_name, location, city, contact_number } = req.body;
    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : rest[0].image_url; // keep existing if no new file uploaded

    await db.query(
      `UPDATE restaurants
         SET restaurant_name = COALESCE(?, restaurant_name),
             location        = COALESCE(?, location),
             city            = COALESCE(?, city),
             contact_number  = COALESCE(?, contact_number),
             image_url       = ?
       WHERE owner_id = ?`,
      [restaurant_name || null, location || null, city || null, contact_number || null, imageUrl, req.user.id]
    );
    res.json({ message: 'Profile updated', image_url: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── POST /api/owner/expire-items — auto-deactivate expired items & notify owner ── */
async function processExpiredItems(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });
    const rid = rest[0].id;

    // Find items that are past expiry and still active
    const [expired] = await db.query(
      `SELECT id, name, quantity, expiry_date, expiry_time
       FROM food_items
       WHERE restaurant_id = ?
         AND is_active = 1
         AND quantity > 0
         AND expiry_date IS NOT NULL
         AND (
           expiry_date < CURDATE()
           OR (expiry_date = CURDATE() AND expiry_time IS NOT NULL AND expiry_time <= CURTIME())
         )`,
      [rid]
    );

    if (expired.length === 0) {
      return res.json({ expired: 0, message: 'No expired items found' });
    }

    // Deactivate all expired items
    const expiredIds = expired.map(i => i.id);
    await db.query(
      `UPDATE food_items SET is_active = 0 WHERE id IN (${expiredIds.map(() => '?').join(',')})`,
      expiredIds
    );

    res.json({
      expired:  expired.length,
      items:    expired.map(i => ({ id: i.id, name: i.name, expiry_date: i.expiry_date, expiry_time: i.expiry_time })),
      message:  `${expired.length} expired item${expired.length !== 1 ? 's' : ''} removed from listings`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/owner/expiry-alerts — items expiring within next 24 hours ── */
async function getExpiryAlerts(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });
    const rid = rest[0].id;

    const [alerts] = await db.query(
      `SELECT id, name, quantity, expiry_date, expiry_time, category,
              TIMESTAMPDIFF(MINUTE, NOW(), TIMESTAMP(expiry_date, COALESCE(expiry_time, '23:59:59'))) AS mins_left
       FROM food_items
       WHERE restaurant_id = ?
         AND is_active = 1
         AND quantity > 0
         AND expiry_date IS NOT NULL
         AND TIMESTAMP(expiry_date, COALESCE(expiry_time, '23:59:59')) > NOW()
         AND TIMESTAMP(expiry_date, COALESCE(expiry_time, '23:59:59')) <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
       ORDER BY expiry_date ASC, expiry_time ASC`,
      [rid]
    );

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { upload, getAllItems, getItemById, getOwnerInventory, getOwnerDashboard, createItem, updateItem, deleteItem, getOwnerProfile, updateOwnerProfile, processExpiredItems, getExpiryAlerts };
