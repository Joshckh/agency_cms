const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /clients - get all clients
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clients ORDER BY id");
    res.render("client/index", { clients: result.rows }); // Pass the clients array to the view(result.rows);
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
    const { name, email, phone, address } = req.body;
    const result = await pool.query(
      "INSERT INTO clients (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, phone, address]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
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
