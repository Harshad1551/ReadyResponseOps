const pool = require("../Authentication/DB");
const express = require("express");
const authenticate = require("../Authentication/Auth-Wrapper");
const router = express.Router();

/* ===================== REPORT INCIDENT ===================== */
router.post("/incidents-report", authenticate, async (req, res) => {
  const { category, severity, latitude, longitude, description } = req.body;

  if (!category || !severity) {
    return res.status(400).json({
      message: "Category and severity are required",
    });
  }

  try {
    if (!["community", "coordinator"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You are not allowed to report incidents",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO incidents
        (category, severity, latitude, longitude, description, reported_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        category,
        severity,
        latitude || null,
        longitude || null,
        description || null,
        req.user.userId,
      ]
    );

    req.app.get("io").emit("incident:new", result.rows[0]);

    // 🔔 NOTIFICATION: Community -> Coordinator
    // "When new incident is reported by community then coordinator will be notified"
    const { createNotification } = require("../utils/notificationUtils");
    await createNotification(pool, req.app.get("io"), {
      recipientRole: 'coordinator',
      type: 'incident_reported',
      title: 'New Incident Reported',
      message: `New ${severity} severity incident reported: ${category}`,
      data: {
        incidentId: result.rows[0].id,
        category,
        severity,
        description
      }
    });

    res.status(201).json({
      message: "Incident reported successfully",
      incident: result.rows[0],
    });
  } catch (err) {
    console.error("INCIDENT REPORT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===================== GET INCIDENTS ===================== */
router.get("/incident-detail", authenticate, async (req, res) => {
  try {
    let query;
    let values = [];

    // 🟢 COMMUNITY → All incidents (filtered by distance/ownership on frontend)
    if (req.user.role === "community") {
      query = `
        SELECT 
          i.*,
          u.name AS reported_by,
          i.reported_by AS reporter_id,
          COALESCE(ARRAY_AGG(r.id) FILTER (WHERE r.id IS NOT NULL), '{}') AS "assignedResources"
        FROM incidents i
        JOIN users u ON i.reported_by = u.id
        LEFT JOIN resources r ON r.incident_id = i.id
        GROUP BY i.id, u.name
        ORDER BY i.created_at DESC
      `;
      // No values needed as we are fetching all
    }

    // 🔵 COORDINATOR → all incidents
    else if (req.user.role === "coordinator") {
      query = `
        SELECT 
          i.*,
          u.name AS reported_by,
          COALESCE(ARRAY_AGG(r.id) FILTER (WHERE r.id IS NOT NULL), '{}') AS "assignedResources"
        FROM incidents i
        JOIN users u ON i.reported_by = u.id
        LEFT JOIN resources r ON r.incident_id = i.id
        GROUP BY i.id, u.name
        ORDER BY i.created_at DESC
      `;
    }

    // 🟣 AGENCY → ONLY incidents where its resource is assigned
    else if (req.user.role === "agency") {
      query = `
        SELECT DISTINCT
          i.*,
          u.name AS reported_by,
          COALESCE(ARRAY_AGG(r.id), '{}') AS "assignedResources"
        FROM incidents i
        JOIN resources r ON r.incident_id = i.id
        JOIN users u ON i.reported_by = u.id
        WHERE r.agency_id = $1
        GROUP BY i.id, u.name
        ORDER BY i.created_at DESC
      `;
      values = [req.user.userId];
      console.log("Agency Request - User ID:", req.user.userId);
    }

    else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    const result = await pool.query(query, values);
    console.log("Query Results Count:", result.rows.length);

    res.json({
      count: result.rows.length,
      incidents: result.rows,
    });
  } catch (err) {
    console.error("INCIDENT FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===================== ASSIGN RESOURCE ===================== */
router.post("/:incidentId/assign-resource", authenticate, async (req, res) => {
  const { incidentId } = req.params;
  const { resourceId } = req.body;

  if (req.user.role !== "coordinator") {
    return res.status(403).json({
      message: "Only coordinators can assign resources",
    });
  }

  if (!resourceId) {
    return res.status(400).json({
      message: "resourceId is required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Validate incident
    const incidentRes = await client.query(
      `SELECT * FROM incidents WHERE id = $1`,
      [incidentId]
    );
    if (incidentRes.rows.length === 0) {
      throw new Error("Incident not found");
    }

    const incident = incidentRes.rows[0];

    // 2️⃣ Validate resource
    const resourceRes = await client.query(
      `SELECT * FROM resources WHERE id = $1`,
      [resourceId]
    );
    if (resourceRes.rows.length === 0) {
      throw new Error("Resource not found");
    }

    const resource = resourceRes.rows[0];

    if (resource.status !== "Available") {
      throw new Error("Resource is not available");
    }

    // 3️⃣ Assign resource → incident
    const updatedResourceRes = await client.query(
      `
      UPDATE resources
      SET status = 'Engaged',
          incident_id = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [incidentId, resourceId]
    );

    const updatedResource = updatedResourceRes.rows[0];

    // 4️⃣ Auto-update incident → ACTIVE
    const updatedIncidentRes = await client.query(
      `
      UPDATE incidents
      SET status = 'active'
      WHERE id = $1 AND status = 'pending'
      RETURNING *
      `,
      [incidentId]
    );

    const updatedIncident = updatedIncidentRes.rows[0];

    // 4.5️⃣ Fetch FULL incident with assigned resources for socket
    const fullIncidentRes = await client.query(
      `
      SELECT 
        i.*,
        u.name AS reported_by,
        COALESCE(ARRAY_AGG(r.id) FILTER (WHERE r.id IS NOT NULL), '{}') AS "assignedResources"
      FROM incidents i
      JOIN users u ON i.reported_by = u.id
      LEFT JOIN resources r ON r.incident_id = i.id
      WHERE i.id = $1
      GROUP BY i.id, u.name
      `,
      [incidentId]
    );
    const fullIncident = fullIncidentRes.rows[0];

    // 5️⃣ 🔓 SYSTEM MESSAGE (unlocks chat for community)
    const systemMessageRes = await client.query(
      `
      INSERT INTO messages (sender_id, receiver_id, incident_id, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        req.user.userId,          // coordinator
        incident.reported_by,     // community user
        incidentId,
        "A resource has been assigned to your incident. You can now chat with the coordinator.",
      ]
    );

    const systemMessage = systemMessageRes.rows[0];

    await client.query("COMMIT");

    // 🔌 SOCKET EVENTS
    const io = req.app.get("io");

    io.emit("incident:updated", fullIncident);
    io.emit("resource:assigned", updatedResource);
    io.emit("new_message", systemMessage);

    // 🔔 NOTIFICATION: Coordinator -> Agency
    // "When coordinator assigns any resource ... agency will be notified"
    const { createNotification } = require("../utils/notificationUtils");

    // Notify Agency of the resource
    await createNotification(pool, io, {
      recipientId: resource.agency_id, // assuming agency_id is the user ID of the agency
      type: 'resource_assigned',
      title: 'Resource Assigned',
      message: `Your resource ${resource.name} has been assigned to ${incident.category}`,
      data: {
        incidentId: incident.id,
        resourceId: resource.id,
        resourceName: resource.name,
        incidentCategory: incident.category
      }
    });

    // 🔔 NOTIFICATION: Coordinator -> Community (Reporter)
    // "community will be notified who have reported the incident"
    await createNotification(pool, io, {
      recipientId: incident.reported_by,
      type: 'resource_assigned',
      title: 'Help is on the way',
      message: `Resource ${resource.name} has been assigned to your incident`,
      data: {
        incidentId: incident.id,
        resourceId: resource.id,
        resourceName: resource.name
      }
    });

    res.json({
      message: "Resource assigned successfully",
      incident: fullIncident,
      resource: updatedResource,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* ===================== RESOLVE INCIDENT ===================== */
router.post("/:incidentId/resolve", authenticate, async (req, res) => {
  const { incidentId } = req.params;

  if (!["community", "coordinator"].includes(req.user.role)) {
    return res.status(403).json({
      message: "You are not authorized to resolve incidents",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if incident exists
    const incidentRes = await client.query(
      `SELECT * FROM incidents WHERE id = $1`,
      [incidentId]
    );

    if (incidentRes.rows.length === 0) {
      throw new Error("Incident not found");
    }

    const incident = incidentRes.rows[0];

    // Check permissions: Community can only resolve their own
    if (req.user.role === "community" && incident.reported_by !== req.user.userId) {
      throw new Error("You can only resolve your own incidents");
    }

    // Update status to resolved
    const updatedIncidentRes = await client.query(
      `
      UPDATE incidents
      SET status = 'resolved'
      WHERE id = $1
      RETURNING *
      `,
      [incidentId]
    );

    const updatedIncident = updatedIncidentRes.rows[0];

    // Release assigned resources and return them
    const releasedResourcesRes = await client.query(
      `
      UPDATE resources
      SET status = 'Available',
          incident_id = NULL
      WHERE incident_id = $1
      RETURNING *
      `,
      [incidentId]
    );

    const releasedResources = releasedResourcesRes.rows;

    await client.query("COMMIT");

    // Notify via Socket
    const io = req.app.get("io");
    io.emit("incident:updated", { ...updatedIncident, status: 'resolved' });

    // Emit updates for all released resources
    // Emit updates for all released resources
    releasedResources.forEach(resource => {
      io.emit("resource:updated", resource);
    });

    // 🔔 NOTIFICATION: Community -> Coordinator
    // "When community resolves the incident then coordinator must be notified"
    const { createNotification } = require("../utils/notificationUtils");
    await createNotification(pool, io, {
      recipientRole: 'coordinator',
      type: 'incident_resolved',
      title: 'Incident Resolved',
      message: `Incident ${incident.category} has been resolved by reporter`,
      data: {
        incidentId: incident.id,
        category: incident.category,
        resolvedBy: req.user.name // assuming name is available in token/user object, otherwise might need fetch
      }
    });

    res.json({
      message: "Incident resolved successfully",
      incident: updatedIncident,
    });

  } catch (err) {
    console.error("RESOLVE INCIDENT ERROR:", err);
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;