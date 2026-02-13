const express = require("express");
const pool = require("../Authentication/DB");
const authenticate = require("../Authentication/Auth-Wrapper");

const router = express.Router();

/* -------------------- SEARCH USERS -------------------- */
/*
  Coordinator → search agencies
  Agency → search coordinator
*/
router.get("/search", authenticate, async (req, res) => {
  const { query = "" } = req.query;
  const { role } = req.user;

  try {
    let roleToSearch;

    if (role === "coordinator") {
      roleToSearch = "agency";
    } else if (role === "agency") {
      roleToSearch = "coordinator";
    } else {
      return res.status(403).json({ message: "Not allowed" });
    }

    const result = await pool.query(
      `
      SELECT u.id, u.name, r.name AS role
      FROM users u
      JOIN role r ON u.role_id = r.id
      WHERE r.name = $1
        AND u.name ILIKE $2
      ORDER BY u.name ASC
      `,
      [roleToSearch, `%${query}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("USER SEARCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;