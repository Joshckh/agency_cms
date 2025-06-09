const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /clients - get all clients
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clients ORDER BY id");
    res.render("client/index", { clients: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM clients WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).render("404", { message: "Client not found." });
    }

    res.render("client/edit", { client: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.post("/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;
    const confirm = await pool.query("SELECT * FROM clients WHERE id = $1", [
      id,
    ]);

    if (confirm.rows.length === 0) {
      return res.status(404).render("404", { message: "Client not found." });
    }
    const { name, email, phone, address } = req.body;
    const result = await pool.query(
      "UPDATE clients SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5 RETURNING *",
      [name, email, phone, address, id]
    );
    res.redirect("/client");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/new", (req, res) => {
  res.render("client/new");
});

router.post("/", async (req, res) => {
  try {
    // Check if user session exists
    const user_id =
      req.session && req.session.user ? req.session.user.id : null;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { name, email, phone, address } = req.body;
    console.log("Trying to insert client:", {
      name,
      email,
      phone,
      address,
      user_id,
    }); // Console log the data being added
    const result = await pool.query(
      "INSERT INTO clients (name, email, phone, address ,user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, phone, address, user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === "undefined_column") {
      return res
        .status(500)
        .json({ error: 'Column "user_id" does not exist in table "clients"' });
    }
    res.status(500).send("Server error");
  }
});

router.post("/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;

    const confirm = await pool.query("SELECT * FROM clients WHERE id = $1", [
      id,
    ]);
    if (confirm.rows.length === 0) {
      return res.status(404).render("404", { message: "Client not found." });
    }

    await pool.query("DELETE FROM clients WHERE id = $1", [id]);
    res.redirect("/client");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
