const db = require('../config/db');

/* ══════════════════════════════════════════════
   OWNER SETTINGS
══════════════════════════════════════════════ */

/* GET /api/owner/settings */
async function getOwnerSettings(req, res) {
  try {
    // Create default row if it doesn't exist yet
    await db.query(
      'INSERT IGNORE INTO owner_settings (user_id) VALUES (?)',
      [req.user.id]
    );

    const [rows] = await db.query(
      'SELECT * FROM owner_settings WHERE user_id = ?',
      [req.user.id]
    );

    const s = rows[0];
    res.json({
      notifications: {
        new_order:         !!s.notif_new_order,
        payment_confirmed: !!s.notif_payment_confirmed,
        expiring_today:    !!s.notif_expiring_today,
        ngo_response:      !!s.notif_ngo_response,
      },
      business_hours: {
        open:  s.biz_open,
        close: s.biz_close,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* PUT /api/owner/settings */
async function updateOwnerSettings(req, res) {
  const { notifications, business_hours } = req.body;

  try {
    await db.query(
      `INSERT INTO owner_settings
         (user_id, notif_new_order, notif_payment_confirmed,
          notif_expiring_today, notif_ngo_response,
          biz_open, biz_close)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         notif_new_order         = VALUES(notif_new_order),
         notif_payment_confirmed = VALUES(notif_payment_confirmed),
         notif_expiring_today    = VALUES(notif_expiring_today),
         notif_ngo_response      = VALUES(notif_ngo_response),
         biz_open                = VALUES(biz_open),
         biz_close               = VALUES(biz_close)`,
      [
        req.user.id,
        notifications?.new_order         ? 1 : 0,
        notifications?.payment_confirmed ? 1 : 0,
        notifications?.expiring_today    ? 1 : 0,
        notifications?.ngo_response      ? 1 : 0,
        business_hours?.open  || '09:00',
        business_hours?.close || '22:00',
      ]
    );
    res.json({ message: 'Settings saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ══════════════════════════════════════════════
   OWNER PROFILE SAVE (name/email/restaurant)
   Existing updateOwnerProfile in foodController
   handles image — this handles text fields only
══════════════════════════════════════════════ */

/* PUT /api/owner/profile/details */
async function updateOwnerDetails(req, res) {
  const { name, email, restaurant_name, city } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Update user name/email
    if (name || email) {
      await conn.query(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
        [name || null, email || null, req.user.id]
      );
    }

    // Update restaurant name/city
    if (restaurant_name || city) {
      await conn.query(
        `UPDATE restaurants SET
           restaurant_name = COALESCE(?, restaurant_name),
           city            = COALESCE(?, city)
         WHERE owner_id = ?`,
        [restaurant_name || null, city || null, req.user.id]
      );
    }

    await conn.commit();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

module.exports = { getOwnerSettings, updateOwnerSettings, updateOwnerDetails };
