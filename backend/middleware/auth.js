function ensureAuthenticated(req, res, next) {
  // Publicly accessible routes
  const publicRoutes = ["/login", "/logout", "/register"];

  if (
    publicRoutes.includes(req.path) ||
    req.path.startsWith("/public") || // static files
    req.path.startsWith("/css") ||
    req.path.startsWith("/js")
  ) {
    return next();
  }

  // Allow access if session is active
  if (req.session && req.session.user) {
    return next();
  }

  // Redirect to login if not authenticated
  return res.redirect("/auth/login");
}

module.exports = { ensureAuthenticated };
