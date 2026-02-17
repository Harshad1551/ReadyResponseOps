const express = require("express");
const pool = require("./DB");
const { genrateToken } = require("./JWT");
const bcrypt = require("bcrypt");
const router = express.Router();

/* -------------------- EMAIL DOMAIN LOGIC -------------------- */

const PUBLIC_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "protonmail.com",
  "rediffmail.com"
];

const isPublicEmail = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return PUBLIC_EMAIL_DOMAINS.includes(domain);
};

/* -------------------- SIGNUP -------------------- */

router.post("/signup", async (req, res) => {
  const { name, email, password, role, organization_name } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const roleResult = await pool.query(
      `SELECT id FROM role WHERE name = $1`,
      [role]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (role !== "community" && !organization_name) {
      return res.status(400).json({
        message: "Organization name required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let is_verified = false;

    if (role === "community") {
      is_verified = true;
    } else {
      is_verified = !isPublicEmail(email);
    }

    const userResult = await pool.query(
      `INSERT INTO users 
       (name, email, password, role_id, organization_name, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [
        name,
        email,
        hashedPassword,
        roleResult.rows[0].id,
        organization_name || null,
        is_verified,
      ]
    );

    const userId = userResult.rows[0].id;

    const token = genrateToken({
      userId,
      role,
      is_verified,
    });

    res.status(201).json({
      message: "Signup successful",
      token,
      role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

});
router.get("/debug-db", async (req, res) => {
const db = await pool.query("SELECT current_database();");
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);

  res.json({
    currentDatabase: db.rows[0].current_database,
    tables: tables.rows,
  });
});

module.exports = router;
