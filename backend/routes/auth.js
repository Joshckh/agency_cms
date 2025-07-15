const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

// Login page
router.get("/login", (req, res) => {
  if (req.session.user) {
    const role = req.session.user.role;

    if (role === "superadmin") {
      return res.redirect("/dashboard/superadmin");
    } else if (role === "admin") {
      return res.redirect("/dashboard/admin");
    } else {
      return res.redirect("/dashboard/agent");
    }
  }

  res.render("auth/login");
});

// Handle login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findFirst({
      where: {
        email,
        can_login: true,
        status: "active", // Optional, for extra safety
      },
    });

    if (!user) {
      return res.status(400).send("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).send("Invalid email or password");
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).send("Login failed");
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).send("Login failed");
        }

        // Redirect based on role
        if (user.role === "superadmin") {
          res.redirect("/dashboard/superadmin");
        } else if (user.role === "admin") {
          res.redirect("/dashboard/admin");
        } else {
          res.redirect("/dashboard/agent");
        }
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).send("Logout failed");
    }

    res.clearCookie("connect.sid"); // Clear session cookie
    res.redirect("/login");
  });
});

module.exports = router;
