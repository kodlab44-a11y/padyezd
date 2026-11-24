const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

function getSql() {
  const connString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connString) {
    throw new Error("Missing POSTGRES_URL environment variable");
  }
  return neon(connString);
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password).trim(), salt, 100000, 64, 'sha512').toString('hex');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let sql;
  try {
    sql = getSql();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const method = req.method;

  try {
    // Ensure admin_auth table exists
    await sql`
      CREATE TABLE IF NOT EXISTS admin_auth (
        id INT PRIMARY KEY DEFAULT 1,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        session_token TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 1. GET: Check if admin password is already initialized
    if (method === 'GET') {
      const rows = await sql`SELECT id FROM admin_auth WHERE id = 1 LIMIT 1`;
      const isSetup = rows.length > 0;
      return res.status(200).json({ isSetup });
    }

    // 2. POST: Setup, Login, Change Password, Verify Token
    if (method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { action, password, newPassword, token } = body;

      // ACTION A: INITIAL FIRST-TIME SETUP (The very first password entered becomes the master password)
      if (action === 'setup') {
        const rows = await sql`SELECT id FROM admin_auth WHERE id = 1 LIMIT 1`;
        if (rows.length > 0) {
          return res.status(400).json({ error: "Şifrə artıq təyin edilib. Zəhmət olmasa daxil olun." });
        }

        const trimmed = String(password || '').trim();
        if (trimmed.length < 4) {
          return res.status(400).json({ error: "Şifrə ən azı 4 simvol olmalıdır." });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = hashPassword(trimmed, salt);
        const sessionToken = crypto.randomBytes(32).toString('hex');

        await sql`
          INSERT INTO admin_auth (id, password_hash, salt, session_token, updated_at)
          VALUES (1, ${passwordHash}, ${salt}, ${sessionToken}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            salt = EXCLUDED.salt,
            session_token = EXCLUDED.session_token,
            updated_at = NOW();
        `;

        return res.status(200).json({ success: true, token: sessionToken, message: "Şifrə uğurla təyin edildi!" });
      }

      // ACTION B: LOGIN
      if (action === 'login') {
        const rows = await sql`SELECT password_hash, salt FROM admin_auth WHERE id = 1 LIMIT 1`;
        if (rows.length === 0) {
          return res.status(400).json({ error: "Sistemdə şifrə təyin edilməyib. İlk şifrəni daxil edin.", needSetup: true });
        }

        const { password_hash, salt } = rows[0];
        const inputHash = hashPassword(String(password || '').trim(), salt);

        if (inputHash !== password_hash) {
          return res.status(401).json({ error: "Şifrə yanlışdır!" });
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        await sql`
          UPDATE admin_auth 
          SET session_token = ${sessionToken}, updated_at = NOW() 
          WHERE id = 1
        `;

        return res.status(200).json({ success: true, token: sessionToken });
      }

      // ACTION C: VERIFY SESSION TOKEN
      if (action === 'verify') {
        const checkToken = token || req.headers['x-admin-token'] || req.headers['x-admin-key'];
        if (!checkToken) {
          return res.status(401).json({ valid: false });
        }

        const rows = await sql`SELECT session_token FROM admin_auth WHERE id = 1 LIMIT 1`;
        if (rows.length > 0 && rows[0].session_token && rows[0].session_token === checkToken) {
          return res.status(200).json({ valid: true });
        }
        return res.status(401).json({ valid: false });
      }

      // ACTION D: CHANGE PASSWORD
      if (action === 'change-password') {
        const checkToken = token || req.headers['x-admin-token'] || req.headers['x-admin-key'];
        const rows = await sql`SELECT password_hash, salt, session_token FROM admin_auth WHERE id = 1 LIMIT 1`;
        if (rows.length === 0) {
          return res.status(400).json({ error: "Sistemdə şifrə yoxdur" });
        }

        const { password_hash, salt, session_token } = rows[0];
        const inputHash = hashPassword(String(password || '').trim(), salt);

        const isOldPasswordValid = inputHash === password_hash;
        const isTokenValid = checkToken && checkToken === session_token;

        if (!isOldPasswordValid && !isTokenValid) {
          return res.status(401).json({ error: "Cari şifrə yanlışdır!" });
        }

        const trimmedNew = String(newPassword || '').trim();
        if (trimmedNew.length < 4) {
          return res.status(400).json({ error: "Yeni şifrə ən azı 4 simvol olmalıdır!" });
        }

        const newSalt = crypto.randomBytes(16).toString('hex');
        const newPasswordHash = hashPassword(trimmedNew, newSalt);
        const newSessionToken = crypto.randomBytes(32).toString('hex');

        await sql`
          UPDATE admin_auth 
          SET password_hash = ${newPasswordHash}, 
              salt = ${newSalt}, 
              session_token = ${newSessionToken}, 
              updated_at = NOW() 
          WHERE id = 1
        `;

        return res.status(200).json({ success: true, token: newSessionToken, message: "Şifrə uğurla yeniləndi!" });
      }

      return res.status(400).json({ error: "Naməlum əməliyyat" });
    }

    return res.status(405).json({ error: "Metod dəstəklənmir" });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ error: "Server daxili xətası: " + err.message });
  }
};
