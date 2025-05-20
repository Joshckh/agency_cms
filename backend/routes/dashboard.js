const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  ensureAuthenticated,
  ensureAdmin,
  ensureSuperadmin,
} = require("../middleware/auth");

router.get("/superadmin", ensureAuthenticated, async (req, res) => {
  try {
    res.render("dashboard/superadmin", { user: req.session.user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
