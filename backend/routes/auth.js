const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const authorizeRoles = require("../middleware/roleGuard").authorizeRoles;
const redirectByRole = require("../services/roleRedirect");

// Login page
router.get("/login", (req, res) => {
  if (req.session.user) {
    const role = req.session.user.role;

    return res.redirect(redirectByRole(role));
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
        status: "active",
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
        res.redirect(redirectByRole(user.role));
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
