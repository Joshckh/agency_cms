// backend/middleware/auth.js
function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  next();
}

function ensureAdmin(req, res, next) {
  if (!req.session.user) return res.redirect("/auth/login");
  if (!["admin", "superadmin"].includes(req.session.user.role)) {
    return res.status(403).send("Access denied");
  }
  next();
}

function ensureSuperadmin(req, res, next) {
  if (!req.session.user) return res.redirect("/auth/login");
  if (req.session.user.role !== "superadmin") {
    return res.status(403).send("Only Superadmin allowed");
  }
  next();
}

module.exports = { ensureAuthenticated, ensureAdmin, ensureSuperadmin };
