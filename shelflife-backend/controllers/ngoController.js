const db = require('../config/db');

/* ══════════════════════════════════════════════
   NGO PROFILE
══════════════════════════════════════════════ */

async function getNgoProfile(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone,
              u.registration_number, u.admin_name, u.focus_area,
              u.city, u.pincode
       FROM users u
       WHERE u.id = ? AND u.role = 'ngo' LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'NGO profile not found' });
    const u = rows[0];
    res.json({
      ngo_name: u.name, email: u.email, phone: u.phone,
      registration_number: u.registration_number, admin_name: u.admin_name,
      focus_area: u.focus_area, city: u.city, pincode: u.pincode,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

async function updateNgoProfile(req, res) {
  const { ngo_name, registration_number, admin_name, email, phone, focus_area, city, pincode } = req.body;
  try {
    await db.query(
      `UPDATE users SET
         name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone),
         registration_number = COALESCE(?, registration_number), admin_name = COALESCE(?, admin_name),
         focus_area = COALESCE(?, focus_area), city = COALESCE(?, city), pincode = COALESCE(?, pincode)
       WHERE id = ?`,
      [ngo_name||null, email||null, phone||null, registration_number||null,
       admin_name||null, focus_area||null, city||null, pincode||null, req.user.id]
    );
    res.json({ message: 'NGO profile updated successfully' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

/* ══════════════════════════════════════════════
   NGO SETTINGS
══════════════════════════════════════════════ */

async function getNgoSettings(req, res) {
  try {
    await db.query('INSERT IGNORE INTO ngo_settings (user_id) VALUES (?)', [req.user.id]);
    const [rows] = await db.query('SELECT * FROM ngo_settings WHERE user_id = ?', [req.user.id]);
    const s = rows[0];
    res.json({
      notifications: {
        new_offer: !!s.notif_new_offer, pickup_reminder: !!s.notif_pickup_reminder,
        offer_expiry: !!s.notif_offer_expiry, weekly_summary: !!s.notif_weekly_summary,
      },
      availability: { from: s.avail_from, until: s.avail_until },
      preferred_cities: s.preferred_cities || '',
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

async function updateNgoSettings(req, res) {
  const { notifications, availability, preferred_cities } = req.body;
  try {
    await db.query(
      `INSERT INTO ngo_settings
         (user_id, notif_new_offer, notif_pickup_reminder, notif_offer_expiry,
          notif_weekly_summary, avail_from, avail_until, preferred_cities)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         notif_new_offer=VALUES(notif_new_offer), notif_pickup_reminder=VALUES(notif_pickup_reminder),
         notif_offer_expiry=VALUES(notif_offer_expiry), notif_weekly_summary=VALUES(notif_weekly_summary),
         avail_from=VALUES(avail_from), avail_until=VALUES(avail_until),
         preferred_cities=VALUES(preferred_cities)`,
      [req.user.id,
       notifications?.new_offer?1:0, notifications?.pickup_reminder?1:0,
       notifications?.offer_expiry?1:0, notifications?.weekly_summary?1:0,
       availability?.from||'08:00', availability?.until||'21:00', preferred_cities||null]
    );
    res.json({ message: 'Settings saved successfully' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

/* ══════════════════════════════════════════════
   NGO RESTAURANT PARTNERS
══════════════════════════════════════════════ */

async function getNgoPartners(req, res) {
  try {
    const [partners] = await db.query(
      `SELECT
         r.id, r.restaurant_name, r.city, r.contact_number,
         r.location, r.image_url, r.shop_type,
         nrp.added_at,
         COUNT(DISTINCT do.id) AS donations_count,
         MAX(do.created_at)    AS last_offer
       FROM ngo_restaurant_partners nrp
       JOIN restaurants r ON r.id = nrp.restaurant_id
       LEFT JOIN donation_offers do
         ON do.restaurant_id = r.id AND do.ngo_id = nrp.ngo_user_id AND do.status = 'completed'
       WHERE nrp.ngo_user_id = ?
       GROUP BY r.id, r.restaurant_name, r.city, r.contact_number,
                r.location, r.image_url, r.shop_type, nrp.added_at
       ORDER BY nrp.added_at DESC`,
      [req.user.id]
    );
    res.json(partners);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

async function addNgoPartner(req, res) {
  const { restaurant_id } = req.body;
  if (!restaurant_id)
    return res.status(400).json({ message: 'restaurant_id is required' });

  try {
    const [rest] = await db.query(
      'SELECT id, restaurant_name FROM restaurants WHERE id = ?',
      [parseInt(restaurant_id)]
    );
    if (!rest.length) return res.status(404).json({ message: 'Restaurant not found' });

    await db.query(
      'INSERT IGNORE INTO ngo_restaurant_partners (ngo_user_id, restaurant_id) VALUES (?,?)',
      [req.user.id, parseInt(restaurant_id)]
    );
    res.status(201).json({ message: `${rest[0].restaurant_name} added as partner` });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

async function removeNgoPartner(req, res) {
  const restaurantId = parseInt(req.params.restaurantId);
  if (!restaurantId || isNaN(restaurantId))
    return res.status(400).json({ message: 'Invalid restaurant ID' });

  try {
    // Clean any NULL rows that may exist from bad inserts
    await db.query(
      'DELETE FROM ngo_restaurant_partners WHERE ngo_user_id IS NULL OR restaurant_id IS NULL'
    );

    const [result] = await db.query(
      'DELETE FROM ngo_restaurant_partners WHERE ngo_user_id = ? AND restaurant_id = ?',
      [req.user.id, restaurantId]
    );

    console.log(`removeNgoPartner: ngo=${req.user.id} restaurant=${restaurantId} affected=${result.affectedRows}`);

    // Return success even if row wasn't in table
    // (partner may be showing from donation history fallback)
    res.json({ message: 'Partner removed successfully', affected: result.affectedRows });
  } catch (err) {
    console.error('removeNgoPartner error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function searchRestaurants(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.restaurant_name, r.city, r.contact_number, r.location, r.image_url, r.shop_type
       FROM restaurants r
       WHERE r.restaurant_name LIKE ? OR r.city LIKE ?
       ORDER BY r.restaurant_name LIMIT 20`,
      [`%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

module.exports = {
  getNgoProfile, updateNgoProfile,
  getNgoSettings, updateNgoSettings,
  getNgoPartners, addNgoPartner, removeNgoPartner,
  searchRestaurants,
};
