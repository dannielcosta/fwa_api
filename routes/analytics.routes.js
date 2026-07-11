const express = require("express");
const router = express.Router();
const pool = require("../db");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

const hasPermission = (req, res, next) => {
  if (!req.payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userPayload = req.payload;

  if (req.payload.type === "admin" || req.payload.type === "gestor") {
    next();
  } else {
    res.status(403).json({ message: "Access denied" });
  }
  } ;

// GET /api/analytics/stats?period=monthly&card_id=xyz
router.get("/analytics-stats/:cardId?", isAuthenticated, hasPermission, async (req, res) => {
  const { cardId } = req.params;
  const { period = "daily" } = req.query;

  try {
    const formatMap = {
      daily: "%d/%m",
      weekly: "%x-%v",
      monthly: "%Y-%m",
      yearly: "%Y",
    };

    const format = formatMap[period] || "%Y-%m";

    let query;
    let params;

    if (cardId) {
      query = `
        SELECT 
          DATE_FORMAT(last_update, ?) AS label,
          SUM(total_reads) AS reads
        FROM card_read_stats
        WHERE card_id = ?
        GROUP BY label
        ORDER BY MIN(last_update) ASC
      `;
      params = [format, cardId];
    } else {
      query = `
        SELECT 
          DATE_FORMAT(last_update, ?) AS label,
          SUM(total_reads) AS reads
        FROM card_read_stats
        GROUP BY label
        ORDER BY MIN(last_update) ASC
      `;
      params = [format];
    }

    const [rows] = await pool.query(query, params);

    res.json(rows.map(r => ({
      label: r.label,
      reads: Number(r.reads),
    })));

  } catch (err) {
    console.error("❌ Erro analytics-stats:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});






// GET /api/analytics/top?limit=5
router.get("/analytics-top", isAuthenticated, hasPermission, async (req, res) => {
  const { limit = 5 } = req.query;

  try {
    const query = `
      SELECT 
        bc.id, 
        bc.first_name, 
        bc.last_name, 
        bc.company, 
        SUM(crs.total_reads) AS total_reads
      FROM card_read_stats crs
      JOIN business_cards bc ON crs.card_id = bc.id
      GROUP BY bc.id
      ORDER BY total_reads DESC
      LIMIT ?;
    `;

    const [rows] = await pool.query(query, [limit]);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar top cartões:", err);
    res.status(500).json({ error: "Erro ao buscar top cartões" });
  }
});

// GET /api/analytics/locations?card_id=xyz
router.get("/analytics-locations", isAuthenticated, hasPermission, async (req, res) => {
  const { card_id } = req.query;

  try {
    const query = `
      SELECT card_id, latitude, longitude, created_at
      FROM card_location
      ${card_id ? "WHERE card_id = ?" : ""}
      ORDER BY created_at DESC
      LIMIT 200;
    `;

    const [rows] = await pool.query(query, card_id ? [card_id] : []);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar localizações:", err);
    res.status(500).json({ error: "Erro ao buscar localizações" });
  }
});


module.exports = router;    