const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ensureAuthenticated } = require("../middleware/auth");

// GET /clients - List all clients for the authenticated user
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const clients = await prisma.clients.findMany({
      where: { user_id: req.session.user.id },
      orderBy: { id: "asc" },
    });
    res.render("client/index", {
      user: req.session.user,
      clients: clients || [],
    });
  } catch (err) {
    console.error("Client list error:", err);
    res.status(500).render("error", { message: "Failed to load clients" });
  }
});

// GET /clients/new - Show client creation form
router.get("/new", ensureAuthenticated, (req, res) => {
  res.render("client/new", { user: req.session.user });
});

// POST /clients - Create new client
router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const client = await prisma.clients.create({
      data: {
        name,
        email,
        phone,
        address,
        user_id: req.session.user.id,
      },
    });

    res.redirect("/client");
  } catch (err) {
    console.error("Client creation error:", err);
    res.status(500).render("error", {
      message: "Failed to create client",
      user: req.session.user,
    });
  }
});

// GET /clients/:id/edit - Show client edit form
router.get("/:id/edit", ensureAuthenticated, async (req, res) => {
  try {
    const client = await prisma.clients.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!client || client.user_id !== req.session.user.id) {
      return res.status(404).render("404", { user: req.session.user });
    }

    res.render("client/edit", {
      user: req.session.user,
      client,
    });
  } catch (err) {
    console.error("Edit form error:", err);
    res.status(500).render("error", {
      message: "Failed to load edit form",
      user: req.session.user,
    });
  }
});

// POST /clients/:id/edit - Update client
router.post("/:id/edit", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // Verify client exists and belongs to user
    const existingClient = await prisma.clients.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingClient || existingClient.user_id !== req.session.user.id) {
      return res.status(404).render("404", { user: req.session.user });
    }

    await prisma.clients.update({
      where: { id: parseInt(id) },
      data: { name, email, phone, address },
    });

    res.redirect("/client");
  } catch (err) {
    console.error("Client update error:", err);
    res.status(500).render("error", {
      message: "Failed to update client",
      user: req.session.user,
    });
  }
});

// POST /clients/:id/delete - Delete client
router.post("/:id/delete", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify client exists and belongs to user
    const client = await prisma.clients.findUnique({
      where: { id: parseInt(id) },
    });

    if (!client || client.user_id !== req.session.user.id) {
      return res.status(404).render("404", { user: req.session.user });
    }

    await prisma.clients.delete({
      where: { id: parseInt(id) },
    });

    res.redirect("/client");
  } catch (err) {
    console.error("Client deletion error:", err);
    res.status(500).render("error", {
      message: "Failed to delete client",
      user: req.session.user,
    });
  }
});

module.exports = router;
