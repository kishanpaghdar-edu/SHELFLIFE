const db = require('../config/db');

/* ── POST /api/donations — owner creates offer ── */
async function createOffer(req, res) {
  const { ngo_id, title, notes, pickup_date, pickup_slot, items } = req.body;
  if (!items || !items.length)
    return res.status(400).json({ message: 'Please select at least one item to donate' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rest] = await conn.query(
      'SELECT id, contact_number, location, city, image_url FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) throw new Error('Restaurant not found');
    const restaurant = rest[0];

    const status = ngo_id ? 'pending' : 'open';

    // Calculate total weight from items for CO2 tracking
    let totalWeightKg = 0;
    const itemRows = [];
    for (const item of items) {
      const [fi] = await conn.query(
        'SELECT id, name, category, weight_kg FROM food_items WHERE id = ?',
        [item.food_item_id]
      );
      if (fi.length) {
        totalWeightKg += parseFloat(fi[0].weight_kg || 0.25) * item.quantity;
        itemRows.push({ ...item, ...fi[0] });
      }
    }

    const [offerResult] = await conn.query(
      `INSERT INTO donation_offers
         (restaurant_id, ngo_id, title, notes, pickup_date, pickup_slot, status,
          total_weight_kg, contact_number, restaurant_address, city, restaurant_image_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        restaurant.id, ngo_id || null,
        title || 'Surplus donation', notes || null,
        pickup_date || null, pickup_slot || null, status,
        totalWeightKg.toFixed(2),
        restaurant.contact_number || null,   // ← cache contact at offer time
        restaurant.location || null,          // ← cache address at offer time
        restaurant.city || null,              // ← cache city at offer time
        restaurant.image_url || null,         // ← cache image at offer time
      ]
    );
    const offerId = offerResult.insertId;

    // Insert offer items with cached name/category/weight
    for (const item of itemRows) {
      await conn.query(
        `INSERT INTO donation_offer_items
           (offer_id, food_item_id, quantity, item_name, category, weight_kg)
         VALUES (?,?,?,?,?,?)`,
        [offerId, item.food_item_id, item.quantity,
         item.name, item.category, item.weight_kg || 0.25]
      );
    }

    await conn.commit();
    res.status(201).json({ id: offerId, message: 'Donation offer created successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(400).json({ message: err.message || 'Server error' });
  } finally {
    conn.release();
  }
}

/* ── GET /api/donations/ngo — NGO inbox (all statuses) ── */
async function getNgoOffers(req, res) {
  try {
    const [offers] = await db.query(
      `SELECT
         do.*,
         r.restaurant_name,
         COALESCE(do.city,                 r.city)             AS city,
         COALESCE(do.contact_number,       r.contact_number)   AS contact_number,
         COALESCE(do.restaurant_address,   r.location)         AS restaurant_address,
         COALESCE(do.restaurant_image_url, r.image_url)        AS restaurant_image_url,
         u.name AS owner_name
       FROM donation_offers do
       JOIN restaurants r ON do.restaurant_id = r.id
       JOIN users u ON r.owner_id = u.id
       WHERE (do.ngo_id = ? OR do.status = 'open')
         AND do.status NOT IN ('declined')
         AND (
           do.pickup_date IS NULL
           OR do.pickup_date >= CURDATE()
         )
       ORDER BY do.created_at DESC`,
      [req.user.id]
    );

    for (const offer of offers) {
      // Use cached item info (item_name) if food_item is deleted
      const [items] = await db.query(
        `SELECT
           doi.id, doi.quantity, doi.weight_kg,
           COALESCE(doi.item_name, fi.name)         AS name,
           COALESCE(doi.category,  fi.category)      AS category,
           fi.is_veg,
           fi.image_url
         FROM donation_offer_items doi
         LEFT JOIN food_items fi ON doi.food_item_id = fi.id
         WHERE doi.offer_id = ?`,
        [offer.id]
      );
      offer.items = items;
    }

    res.json(offers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── PUT /api/donations/:id/respond — NGO accept or decline ── */
async function respondToOffer(req, res) {
  const { action, ngo_notes, decline_reason } = req.body;
  if (!['accept', 'decline'].includes(action))
    return res.status(400).json({ message: 'action must be accept or decline' });

  try {
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    await db.query(
      `UPDATE donation_offers
       SET status = ?, ngo_id = ?, ngo_notes = ?, decline_reason = ?
       WHERE id = ?`,
      [newStatus, req.user.id, ngo_notes || null, decline_reason || null, req.params.id]
    );
    res.json({ message: `Offer ${newStatus} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── PUT /api/donations/:id/complete ── */
async function completeOffer(req, res) {
  try {
    // Fetch offer to compute CO2
    const [[offer]] = await db.query(
      'SELECT total_weight_kg FROM donation_offers WHERE id = ?',
      [req.params.id]
    );

    const co2 = offer?.total_weight_kg
      ? (parseFloat(offer.total_weight_kg) * 2.5).toFixed(2)
      : null;

    await db.query(
      `UPDATE donation_offers
       SET status = 'completed',
           completed_at = NOW(),
           co2_saved_kg = ?
       WHERE id = ?`,
      [co2, req.params.id]
    );
    res.json({ message: 'Donation marked as completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/donations/ngo/dashboard ── */
async function getNgoDashboard(req, res) {
  try {
    const [[stats]] = await db.query(
      `SELECT
         SUM(status IN ('open','pending'))  AS pending,
         SUM(status = 'accepted')           AS accepted,
         SUM(status = 'completed')          AS completed,
         SUM(status = 'declined')           AS declined
       FROM donation_offers
       WHERE ngo_id = ? OR status = 'open'`,
      [req.user.id]
    );
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/donations/owner — owner sees their offer history ── */
async function getOwnerOffers(req, res) {
  try {
    const [rest] = await db.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });

    const [offers] = await db.query(
      `SELECT do.*, u.name AS ngo_name
       FROM donation_offers do
       LEFT JOIN users u ON do.ngo_id = u.id
       WHERE do.restaurant_id = ?
       ORDER BY do.created_at DESC`,
      [rest[0].id]
    );

    for (const offer of offers) {
      const [items] = await db.query(
        `SELECT doi.*,
                COALESCE(doi.item_name, fi.name) AS name
         FROM donation_offer_items doi
         LEFT JOIN food_items fi ON doi.food_item_id = fi.id
         WHERE doi.offer_id = ?`,
        [offer.id]
      );
      offer.items = items;
    }

    res.json(offers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createOffer, getNgoOffers, respondToOffer,
  completeOffer, getNgoDashboard, getOwnerOffers,
};
