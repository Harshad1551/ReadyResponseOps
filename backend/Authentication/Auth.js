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
    // 1️⃣ Get role ID
    const roleResult = await pool.query(
      `SELECT id FROM role WHERE name = $1`,
      [role]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 2️⃣ Validate organization
    if (role !== "community" && !organization_name) {
      return res.status(400).json({
        message: "Organization name required",
      });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Verification logic
    let is_verified = false;

    if (role === "community") {
      is_verified = true;
    } else {
      is_verified = !isPublicEmail(email);
    }

    // 5️⃣ Insert user
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

    // 6️⃣ Generate token
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
    console.error("Signup Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- DEBUG DATABASE ROUTE -------------------- */


app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    
    res.json({
      success: true,
      message: "Database connected successfully",
      serverTime: result.rows[0].now,
      databaseUrlUsed: process.env.DATABASE_URL
        ? "DATABASE_URL is set"
        : "DATABASE_URL is NOT set"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
