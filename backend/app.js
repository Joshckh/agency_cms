const express = require("express");
const app = express();
const routes = require("./routes");
const clientsRouter = require("./routes/client");
const path = require("path");

require("dotenv").config();

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api", routes);
app.use("/client", clientsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use((req, res) => {
  res.status(404).render("404"); // Create a 404.ejs view
});
