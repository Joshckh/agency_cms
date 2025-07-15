// backend/app.js
const express = require("express");
const path = require("path");
const session = require("express-session");
require("dotenv").config();
const { ensureAuthenticated } = require("./middleware/auth");

const app = express();

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS in production
  })
);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add user to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// CRON JOB
const { startPolicyStatusCron } = require("./cron-jobs/policyStatusChecker");
startPolicyStatusCron();

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

// ✅ Global authentication middleware
app.use((req, res, next) => {
  const publicPaths = ["/auth/login", "/auth/logout", "/auth/login?error"];
  const isPublic =
    publicPaths.includes(req.path) || req.path.startsWith("/public");

  if (isPublic || (req.path.startsWith("/auth") && req.method === "POST")) {
    return next();
  }

  return ensureAuthenticated(req, res, next);
});

// ✅ Routes
const mainRoutes = require("./routes");
const clientsRouter = require("./routes/client");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const policyRoutes = require("./routes/policy");
const superadminRoutes = require("./routes/superadmin");

app.use("/auth", authRoutes);
app.use("/client", clientsRouter);
app.use("/dashboard", dashboardRoutes);
app.use("/policy", policyRoutes);
app.use("/superadmin", superadminRoutes);
app.use("/", mainRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404");
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
