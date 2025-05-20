const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// Login page
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// Handle login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).send("Invalid email or password");
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).send("Invalid email or password");
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      role: user.role,
    };

    // Redirect based on role
    if (user.role === "superadmin") {
      res.redirect("/dashboard/superadmin");
    } else if (user.role === "admin") {
      res.redirect("/dashboard/admin");
    } else {
      res.redirect("/dashboard/agent");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
