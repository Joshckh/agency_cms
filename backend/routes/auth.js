const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
// Login page
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// Handle login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await prisma.users.findFirst({
      where: {
        email,
      },
    });

    if (!userResult) {
      return res.status(400).send("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, userResult.password_hash);

    if (!isMatch) {
      return res.status(400).send("Invalid email or password");
    }

    req.session.user = {
      id: userResult.id,
      name: userResult.name,
      role: userResult.role,
    };

    // Redirect based on role
    if (userResult.role === "superadmin") {
      res.redirect("/dashboard/superadmin");
    } else if (userResult.role === "admin") {
      res.redirect("/dashboard/admin");
    } else {
      res.redirect("/dashboard/agent");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).send("Logout failed");
    }
    res.redirect("/login"); // Or wherever your login page is
  });
});

module.exports = router;
