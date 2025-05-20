const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

// ========== Session Configuration ==========
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
    },
  })
);

// ========== Middleware ==========
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ========== View Engine Setup ==========
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

// ========== Routes ==========
const mainRoutes = require("./routes");
const clientsRouter = require("./routes/client");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

app.use("/auth", authRoutes);
app.use("/client", clientsRouter);
app.use("/dashboard", dashboardRoutes);
app.use("/", mainRoutes);

// ========== 404 Handler ==========
app.use((req, res) => {
  res.status(404).render("404");
});

// ========== Server ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
