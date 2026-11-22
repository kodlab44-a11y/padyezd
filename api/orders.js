const { neon } = require('@neondatabase/serverless');

const ADMIN_KEY = "Padyezd*Baku#2026";

function getSql() {
  const connString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connString) {
    throw new Error("Missing POSTGRES_URL environment variable");
  }
  return neon(connString);
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

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
    // 1. GET REQUEST
    if (method === 'GET') {
      const code = req.query.code;

      // Public tracking search by code
      if (code) {
        const clean = String(code).trim().toLowerCase();
        const rows = await sql`
          SELECT id, mehsul, musteri, telefon, 
                 baglama_nomre AS "baglamaNomre", 
                 izleme_kodu AS "izlemeKodu", 
                 satis, status, tarix::text, qeyd
          FROM orders
          WHERE LOWER(izleme_kodu) = ${clean} OR LOWER(baglama_nomre) = ${clean}
          LIMIT 1
        `;

        if (rows.length === 0) {
          return res.status(404).json({ error: "Sifariş tapılmadı" });
        }
        return res.status(200).json(rows[0]);
      }

      // Admin list of all orders (requires auth)
      const clientKey = req.headers['x-admin-key'] || req.query.adminKey;
      if (clientKey !== ADMIN_KEY) {
        return res.status(401).json({ error: "İcazə verilmədi (Unauthorized)" });
      }

      const rows = await sql`
        SELECT id, mehsul, musteri, telefon, 
               baglama_nomre AS "baglamaNomre", 
               izleme_kodu AS "izlemeKodu", 
               maya_cny AS "mayaCny",
               maya_azn AS "mayaAzn",
               kargo, satis, status, tarix::text, qeyd
        FROM orders
        ORDER BY id DESC
      `;
      return res.status(200).json(rows);
    }

    // 2. POST REQUEST (CREATE / UPDATE ORDER)
    if (method === 'POST') {
      const clientKey = req.headers['x-admin-key'] || (req.body && req.body.adminKey);
      if (clientKey !== ADMIN_KEY) {
        return res.status(401).json({ error: "İcazə verilmədi (Unauthorized)" });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        id, mehsul, musteri, telefon, baglamaNomre, izlemeKodu,
        mayaCny, mayaAzn, kargo, satis, status, tarix, qeyd
      } = body;

      if (!mehsul || !izlemeKodu) {
        return res.status(400).json({ error: "Məhsul adı və izləmə kodu vacibdir" });
      }

      const orderId = id ? BigInt(id) : BigInt(Date.now());
      const orderDate = tarix || new Date().toISOString().split('T')[0];

      await sql`
        INSERT INTO orders (
          id, mehsul, musteri, telefon, baglama_nomre, izleme_kodu,
          maya_cny, maya_azn, kargo, satis, status, tarix, qeyd
        )
        VALUES (
          ${orderId.toString()}, ${mehsul}, ${musteri || ''}, ${telefon || ''}, 
          ${baglamaNomre}, ${izlemeKodu}, 
          ${Number(mayaCny) || 0}, ${Number(mayaAzn) || 0}, ${Number(kargo) || 0}, 
          ${Number(satis) || 0}, ${status || 'sifaris verilib'}, 
          ${orderDate}, ${qeyd || ''}
        )
        ON CONFLICT (id) DO UPDATE SET
          mehsul = EXCLUDED.mehsul,
          musteri = EXCLUDED.musteri,
          telefon = EXCLUDED.telefon,
          baglama_nomre = EXCLUDED.baglama_nomre,
          izleme_kodu = EXCLUDED.izleme_kodu,
          maya_cny = EXCLUDED.maya_cny,
          maya_azn = EXCLUDED.maya_azn,
          kargo = EXCLUDED.kargo,
          satis = EXCLUDED.satis,
          status = EXCLUDED.status,
          tarix = EXCLUDED.tarix,
          qeyd = EXCLUDED.qeyd
      `;

      return res.status(200).json({ success: true, id: orderId.toString() });
    }

    // 3. DELETE REQUEST (DELETE ORDER)
    if (method === 'DELETE') {
      const clientKey = req.headers['x-admin-key'] || req.query.adminKey;
      if (clientKey !== ADMIN_KEY) {
        return res.status(401).json({ error: "İcazə verilmədi (Unauthorized)" });
      }

      const orderId = req.query.id;
      if (!orderId) {
        return res.status(400).json({ error: "Order ID tələb olunur" });
      }

      await sql`DELETE FROM orders WHERE id = ${String(orderId)}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
