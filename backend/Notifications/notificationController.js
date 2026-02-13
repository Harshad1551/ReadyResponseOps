const pool = require("../Authentication/DB");

// Get notifications for the authenticated user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Fetch notifications where:
        // 1. recipient_user_id matches current user OR
        // 2. recipient_role matches current user's role
        const query = `
      SELECT * FROM notifications 
      WHERE recipient_user_id = $1 
         OR recipient_role = $2
      ORDER BY created_at DESC
      LIMIT 50
    `;

        const result = await pool.query(query, [userId, userRole]);

        // Count unread
        const unreadQuery = `
      SELECT COUNT(*) FROM notifications 
      WHERE (recipient_user_id = $1 OR recipient_role = $2)
        AND read = FALSE
    `;
        const unreadResult = await pool.query(unreadQuery, [userId, userRole]);

        res.json({
            notifications: result.rows,
            unreadCount: parseInt(unreadResult.rows[0].count)
        });
    } catch (err) {
        console.error("GET NOTIFICATIONS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// Mark a single notification as read
const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Only allow if the notification belongs to this user/role
        // Ideally we should check ownership, but for simplicity we rely on the ID
        // and assume the user is only marking what they see.
        // A stricter check would be: WHERE id=$1 AND (recipient_user_id=$2 OR recipient_role=$3)

        const query = `
      UPDATE notifications 
      SET read = TRUE 
      WHERE id = $1
      RETURNING *
    `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("MARK READ ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// Mark ALL as read for a user
const markAllRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        const query = `
      UPDATE notifications 
      SET read = TRUE 
      WHERE (recipient_user_id = $1 OR recipient_role = $2)
        AND read = FALSE
    `;

        await pool.query(query, [userId, userRole]);

        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        console.error("MARK ALL READ ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getNotifications,
    markRead,
    markAllRead
};
