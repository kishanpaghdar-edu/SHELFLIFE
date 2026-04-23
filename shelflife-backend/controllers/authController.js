const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

/* ── POST /api/auth/register/owner ── */
async function registerOwner(req, res) {
  const { name, email, phone, password, restaurant_name, location, city, contact_number } = req.body;
  if (!name || !email || !password || !restaurant_name)
    return res.status(400).json({ message: 'name, email, password and restaurant_name are required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?,?,?,?,?)',
      [name, email, hash, phone || null, 'owner']
    );
    const userId = userResult.insertId;

    await conn.query(
      'INSERT INTO restaurants (owner_id, restaurant_name, location, city, contact_number) VALUES (?,?,?,?,?)',
      [userId, restaurant_name, location || null, city || null, contact_number || null]
    );

    // Create default owner settings row
    await conn.query('INSERT IGNORE INTO owner_settings (user_id) VALUES (?)', [userId]);

    await conn.commit();
    // Set initial login tracking for new account
    await conn.query('UPDATE users SET login_count = 1, last_login = NOW() WHERE id = ?', [userId]);
    const token = signToken({ id: userId, email, role: 'owner' });
    res.status(201).json({
      token,
      is_first_login: true,
      login_count:    1,
      last_login:     null,
      user: { id: userId, name, email, role: 'owner', restaurant_name },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

/* ── POST /api/auth/register/user ── */
async function registerUser(req, res) {
  const { name, email, phone, password, address, city, pincode } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'name, email and password are required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?,?,?,?,?)',
      [name, email, hash, phone || null, 'user']
    );
    const userId = userResult.insertId;

    if (address || city || pincode) {
      await conn.query(
        'INSERT INTO user_addresses (user_id, address, city, pincode, is_primary) VALUES (?,?,?,?,1)',
        [userId, address || null, city || null, pincode || null]
      );
    }

    // Create default impact stats row
    await conn.query('INSERT IGNORE INTO user_impact_stats (user_id) VALUES (?)', [userId]);

    await conn.commit();
    await conn.query('UPDATE users SET login_count = 1, last_login = NOW() WHERE id = ?', [userId]);
    const token = signToken({ id: userId, email, role: 'user' });
    res.status(201).json({
      token,
      is_first_login: true,
      login_count:    1,
      last_login:     null,
      user: { id: userId, name, email, role: 'user' },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

/* ── POST /api/auth/register/ngo ── */
async function registerNgo(req, res) {
  const { name, email, phone, password, city, pincode } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'name, email and password are required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password, phone, role, city, pincode) VALUES (?,?,?,?,?,?,?)',
      [name, email, hash, phone || null, 'ngo', city || null, pincode || null]
    );
    const userId = userResult.insertId;

    if (city) {
      await conn.query(
        'INSERT INTO user_addresses (user_id, city, pincode) VALUES (?,?,?)',
        [userId, city, pincode || null]
      );
    }

    // Create default NGO settings and impact stats rows
    await conn.query('INSERT IGNORE INTO ngo_settings (user_id) VALUES (?)', [userId]);
    await conn.query('INSERT IGNORE INTO user_impact_stats (user_id) VALUES (?)', [userId]);

    await conn.commit();
    await conn.query('UPDATE users SET login_count = 1, last_login = NOW() WHERE id = ?', [userId]);
    const token = signToken({ id: userId, email, role: 'ngo' });
    res.status(201).json({
      token,
      is_first_login: true,
      login_count:    1,
      last_login:     null,
      user: { id: userId, name, email, role: 'ngo' },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

/* ── POST /api/auth/login ── */
async function login(req, res) {
  const { email, password, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ message: 'email, password and role are required' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
    if (!rows.length)
      return res.status(401).json({ message: 'Invalid email, password or role' });

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email, password or role' });

    // Track login count and last login timestamp
    const prevLoginCount = user.login_count || 0;
    const lastLogin      = user.last_login || null;
    await db.query(
      'UPDATE users SET login_count = login_count + 1, last_login = NOW() WHERE id = ?',
      [user.id]
    );
    const isFirstLogin = prevLoginCount === 0;

    let extra = {};

    if (role === 'owner') {
      const [rest] = await db.query(
        'SELECT restaurant_name, city, image_url FROM restaurants WHERE owner_id = ? LIMIT 1',
        [user.id]
      );
      if (rest.length) extra = {
        restaurant_name: rest[0].restaurant_name,
        city:            rest[0].city,
        shopName:        rest[0].restaurant_name,
        restaurant_image_url: rest[0].image_url,
      };
    }

    if (role === 'user') {
      const [addr] = await db.query(
        'SELECT address, city, pincode FROM user_addresses WHERE user_id = ? AND is_primary = 1 LIMIT 1',
        [user.id]
      );
      // fallback to any address if no primary set
      if (addr.length) {
        extra = { delivery_address: addr[0].address, city: addr[0].city, pincode: addr[0].pincode };
      } else {
        const [anyAddr] = await db.query(
          'SELECT address, city, pincode FROM user_addresses WHERE user_id = ? LIMIT 1',
          [user.id]
        );
        if (anyAddr.length) extra = { delivery_address: anyAddr[0].address, city: anyAddr[0].city };
      }
    }

    if (role === 'ngo') {
      extra = {
        ngoName:             user.name,
        admin_name:          user.admin_name,
        registration_number: user.registration_number,
        focus_area:          user.focus_area,
        city:                user.city,
        pincode:             user.pincode,
      };
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      token,
      is_first_login: isFirstLogin,
      login_count:    prevLoginCount + 1,
      last_login:     lastLogin,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
        ...extra,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── PUT /api/auth/change-password — all roles ── */
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ message: 'current_password and new_password are required' });
  if (new_password.length < 6)
    return res.status(400).json({ message: 'New password must be at least 6 characters' });

  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── GET /api/user/profile — user delivery address ── */
async function getUserProfile(req, res) {
  try {
    const [user] = await db.query(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user.length) return res.status(404).json({ message: 'User not found' });

    const [addr] = await db.query(
      'SELECT address, city, pincode FROM user_addresses WHERE user_id = ? AND is_primary = 1 LIMIT 1',
      [req.user.id]
    );
    // fallback to any address
    const [anyAddr] = addr.length ? [addr] : await db.query(
      'SELECT address, city, pincode FROM user_addresses WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    res.json({
      ...user[0],
      delivery_address: anyAddr?.[0]?.address || null,
      city:             anyAddr?.[0]?.city    || null,
      pincode:          anyAddr?.[0]?.pincode || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── PUT /api/user/profile — save delivery address ── */
async function updateUserProfile(req, res) {
  const { name, phone, delivery_address, city, pincode } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Update user basic info if provided
    if (name || phone) {
      await conn.query(
        'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?',
        [name || null, phone || null, req.user.id]
      );
    }

    // Update or insert delivery address
    if (delivery_address !== undefined || city !== undefined) {
      const [existing] = await conn.query(
        'SELECT id FROM user_addresses WHERE user_id = ? AND is_primary = 1 LIMIT 1',
        [req.user.id]
      );

      if (existing.length) {
        await conn.query(
          `UPDATE user_addresses
             SET address = COALESCE(?, address),
                 city    = COALESCE(?, city),
                 pincode = COALESCE(?, pincode)
           WHERE user_id = ? AND is_primary = 1`,
          [delivery_address || null, city || null, pincode || null, req.user.id]
        );
      } else {
        await conn.query(
          'INSERT INTO user_addresses (user_id, address, city, pincode, is_primary) VALUES (?,?,?,?,1)',
          [req.user.id, delivery_address || null, city || null, pincode || null]
        );
      }
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

module.exports = {
  registerOwner, registerUser, registerNgo,
  login,
  changePassword,
  getUserProfile, updateUserProfile,
};
