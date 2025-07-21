const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const redirectByRole = require("../services/roleRedirect");

// GET: Login page
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect(redirectByRole(req.session.user.role));
  }

  res.render("auth/login", {
    title: "Login",
    user: null,
  });
});

// POST: Handle login form
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
      return res.status(400).render("auth/login", {
        title: "Login",
        user: null,
        error: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).render("auth/login", {
        title: "Login",
        user: null,
        error: "Invalid email or password",
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).render("auth/login", {
          title: "Login",
          user: null,
          error: "Login failed. Please try again.",
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).render("auth/login", {
            title: "Login",
            user: null,
            error: "Login failed. Please try again.",
          });
        }

        return res.redirect(redirectByRole(user.role));
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).render("auth/login", {
      title: "Login",
      user: null,
      error: "Unexpected server error. Please try again later.",
    });
  }
});

// GET: Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).send("Logout failed.");
    }

    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

module.exports = router;
