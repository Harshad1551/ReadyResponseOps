const express = require("express");
const router = express.Router();
const pool = require("../Authentication/DB");
const authenticate = require("../Authentication/Auth-Wrapper");

router.post("/create-resource", authenticate, async (req, res) => {
  const { name, type, latitude, longitude } = req.body;

  if (!["agency"].includes(req.user.role)) {
    return res.status(403).json({
      message: "You are not authorized to add resources",
    });
  }

  if (!name || !type) {
    return res.status(400).json({
      message: "Name and type are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO resources (name, type, latitude, longitude, agency_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, type, latitude || null, longitude || null, req.user.userId]
    );
    const io = req.app.get("io");
    io.emit("resource:new", result.rows[0]);

    // 🔔 NOTIFICATION: Agency -> Coordinator
    // "When new resource is added then coordinator will be notified"
    const { createNotification } = require("../utils/notificationUtils");
    await createNotification(pool, io, {
      recipientRole: 'coordinator',
      type: 'resource_added',
      title: 'New Resource Added',
      message: `New resource ${name} (${type}) has been added by agency`,
      data: {
        resourceId: result.rows[0].id,
        name,
        type,
        agencyId: req.user.userId
      }
    });

    res.status(201).json({
      message: "Resource created",
      resource: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch("/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["Available", "Engaged", "Unavailable"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status value",
    });
  }

  if (!["coordinator", "agency"].includes(req.user.role)) {
    return res.status(403).json({
      message: "You are not authorized to update resource status",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE resources
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    const io = req.app.get("io");
    io.emit("resource:update", result.rows[0]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Resource not found",
      });
    }

    res.json({
      message: "Resource status updated",
      resource: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/resource-dashboard", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        type,
        status,
        latitude,
        longitude,
        agency_id
      FROM resources
      ORDER BY id DESC
    `);


    res.json(result.rows);
    res.json({ count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    let query = `
      SELECT
        id,
        name,
        type,
        status,
        latitude,
        longitude,
        agency_id
      FROM resources
    `;

    let values = [];

    if (req.user.role === 'agency') {
      query += ` WHERE agency_id = $1`;
      values.push(req.user.userId);
    }

    query += ` ORDER BY id DESC`;

    const result = await pool.query(query, values);

    res.json(result.rows); // ⚠️ IMPORTANT: send array, not object
  } catch (err) {
    console.error("GET RESOURCES ERROR:", err.message);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

module.exports = router