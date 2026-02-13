const createNotification = async (pool, io, { recipientId, recipientRole, type, title, message, data }) => {
    try {
        // 1. Insert into DB
        const query = `
      INSERT INTO notifications 
      (recipient_user_id, recipient_role, type, message, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        // Support either specific user ID or role-based notification
        const values = [
            recipientId || null,
            recipientRole || null,
            type,
            message,
            data || {}
        ];

        const result = await pool.query(query, values);
        const notification = result.rows[0];

        // 2. Emit Socket Event
        // If specific user
        if (recipientId) {
            io.to(`user:${recipientId}`).emit("notification:new", notification);
        }
        // If role-based (client needs to join these rooms)
        else if (recipientRole) {
            io.to(`role:${recipientRole}`).emit("notification:new", notification);
        }

        return notification;
    } catch (error) {
        console.error("NOTIFICATION ERROR:", error);
        // Don't crash the main flow if notification fails
        return null;
    }
};

module.exports = { createNotification };
