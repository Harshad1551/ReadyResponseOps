const pool = require("../Authentication/DB");

/* -------------------- ROLE CHECK -------------------- */

const canCommunityChatWithCoordinator = async (
  communityId,
  coordinatorId,
  incidentId
) => {
  if (!incidentId) return false;

  const result = await pool.query(
    `
    SELECT 1
    FROM incidents i
    JOIN resources r ON r.incident_id = i.id
    WHERE
      i.id = $1
      AND i.reported_by = $2
      AND i.status IN ('active', 'resolved')
    LIMIT 1
    `,
    [incidentId, communityId]
  );

  return result.rows.length > 0;
};

/* -------------------- SEND MESSAGE -------------------- */

exports.sendMessage = async (req, res) => {
  const { receiverId, message, incidentId } = req.body;
  const { userId, role } = req.user;

  try {
    // 🔐 Community → Coordinator check
    if (role === "community") {
      const allowed = await canCommunityChatWithCoordinator(
        userId,
        receiverId,
        incidentId
      );

      if (!allowed) {
        return res.status(403).json({
          message: "Chat not allowed until resource is assigned",
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO messages (sender_id, receiver_id, incident_id, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [userId, receiverId, incidentId || null, message]
    );

    const io = req.app.get("io");
    io.emit("new_message", result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};
/* -------------------- FETCH MESSAGES -------------------- */

exports.getMessages = async (req, res) => {
  const { userId, role } = req.user;

  try {
    let query;
    let values = [userId];

    if (role === "community") {
      query = `
        SELECT
          m.id,
          m.sender_id,
          m.receiver_id,
          m.incident_id,
          m.message,
          m.is_read,
          m.created_at,

          su.name AS sender_name,
          sr.name AS sender_role,

          ru.name AS receiver_name,
          rr.name AS receiver_role

        FROM messages m
        JOIN incidents i ON i.id = m.incident_id

        JOIN users su ON su.id = m.sender_id
        JOIN role sr ON sr.id = su.role_id

        JOIN users ru ON ru.id = m.receiver_id
        JOIN role rr ON rr.id = ru.role_id

        WHERE
          (m.sender_id = $1 OR m.receiver_id = $1)
          AND i.reported_by = $1
          AND i.status IN ('active', 'resolved')

        ORDER BY m.created_at ASC
      `;
    } else {
      query = `
        SELECT
          m.id,
          m.sender_id,
          m.receiver_id,
          m.incident_id,
          m.message,
          m.is_read,
          m.created_at,

          su.name AS sender_name,
          sr.name AS sender_role,

          ru.name AS receiver_name,
          rr.name AS receiver_role

        FROM messages m

        JOIN users su ON su.id = m.sender_id
        JOIN role sr ON sr.id = su.role_id

        JOIN users ru ON ru.id = m.receiver_id
        JOIN role rr ON rr.id = ru.role_id

        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY m.created_at ASC
      `;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("FETCH MESSAGE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
/* -------------------- MARK AS READ -------------------- */

exports.markAsRead = async (req, res) => {
  const { userId } = req.user;

  try {
    await pool.query(
      `UPDATE messages
       SET is_read = true
       WHERE receiver_id = $1`,
      [userId]
    );

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("READ MESSAGE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    // Allow delete only if user is sender OR receiver
    const result = await pool.query(
      `
      DELETE FROM messages
      WHERE id = $1
        AND (sender_id = $2 OR receiver_id = $2)
      RETURNING id
      `,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Message not found or not authorized",
      });
    }

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("DELETE MESSAGE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};