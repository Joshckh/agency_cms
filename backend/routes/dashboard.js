// routes/dashboard.js
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");

router.get("/", ensureAuthenticated, (req, res) => {
  const role = req.session.user.role;

  switch (role) {
    case "superadmin":
      return res.render("dashboard/superadmin_dashboard", {
        user: req.session.user,
      });
    case "admin":
      return res.render("dashboard/admin_dashboard", {
        user: req.session.user,
      });
    case "user":
    default:
      return res.render("dashboard/user_dashboard", { user: req.session.user });
  }
});

module.exports = router;
