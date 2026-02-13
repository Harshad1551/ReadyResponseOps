const express = require("express");
const router = express.Router();
const pool = require("../Authentication/DB");
const authenticate = require("../Authentication/Auth-Wrapper");

/**
 * GET /map/nearby?lat=..&lng=..&radius=..
 * radius in KM
 */
router.get("/nearby", authenticate, async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      message: "Latitude and longitude are required",
    });
  }

  try {
    // 🔴 INCIDENTS (within radius)
    const incidentsQuery = `
      SELECT id, category, severity, latitude, longitude, status, created_at
      FROM incidents
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )
        ) <= $3
      ORDER BY created_at DESC
    `;

    // 🔵 RESOURCES (within radius)
    const resourcesQuery = `
      SELECT id, name, type, status, latitude, longitude
      FROM resources
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )
        ) <= $3
      ORDER BY name
    `;

    const [incidents, resources] = await Promise.all([
      pool.query(incidentsQuery, [lat, lng, radius]),
      pool.query(resourcesQuery, [lat, lng, radius]),
    ]);

    res.json({
      center: { lat: Number(lat), lng: Number(lng) },
      incidents: incidents.rows,
      resources: resources.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
