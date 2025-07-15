// backend/routes/policy.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ensureAuthenticated } = require("../middleware/auth");
const {
  calculateCommission,
  distributeImmediateCommissions,
  distributeRecursiveCommissions,
} = require("../services/commissonAdder");

// Utility: Choose your preferred commission strategy here
const distributeCommissions = distributeRecursiveCommissions; // or distributeImmediateCommissions

// List all policies
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const policies = await prisma.policies.findMany({
      where: { user_id: req.session.user.id },
    });
    res.render("policy/index", {
      user: req.session.user,
      policies: policies || [],
    });
  } catch (err) {
    console.error("Policy list error:", err);
    res.status(500).render("error", { message: "Failed to load policies" });
  }
});

// Show policy creation form
router.get("/create", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await prisma.users.findUnique({ where: { id: userId } });

    const commissionRates = await prisma.commission_rates.findMany({
      where: { rank_id: user.rank_id },
    });

    const clients = await prisma.clients.findMany({
      where: { user_id: userId },
    });

    res.render("policy/create", {
      user,
      clients,
      policyTypes: commissionRates.map((r) => r.policy_type),
    });
  } catch (err) {
    console.error("Create form error:", err);
    res
      .status(500)
      .render("error", { message: "Failed to load creation form" });
  }
});

// Create new policy + commissions
router.post("/create", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { client_id, policy_type, start_date, end_date, premium } = req.body;

    const client = await prisma.clients.findUnique({
      where: { id: parseInt(client_id) },
    });

    if (!client || client.user_id !== userId) {
      return res
        .status(403)
        .render("error", { message: "Unauthorized client selection" });
    }

    const newPolicy = await prisma.policies.create({
      data: {
        client_id: parseInt(client_id),
        user_id: userId,
        policy_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        premium: parseFloat(premium),
      },
    });

    await distributeCommissions(
      userId,
      newPolicy.id,
      parseFloat(premium),
      policy_type
    );

    res.redirect("/policy");
  } catch (err) {
    console.error("Policy creation error:", err);
    res.status(500).render("error", { message: "Failed to create policy" });
  }
});

// Show policy edit form
router.get("/:id/edit", ensureAuthenticated, async (req, res) => {
  try {
    const [clients, policy] = await Promise.all([
      prisma.clients.findMany({ where: { user_id: req.session.user.id } }),
      prisma.policies.findUnique({ where: { id: parseInt(req.params.id) } }),
    ]);

    if (!policy) {
      return res.status(404).render("error", { message: "Policy not found" });
    }

    res.render("policy/edit", {
      user: req.session.user,
      clients: clients || [],
      policy,
    });
  } catch (err) {
    console.error("Edit form error:", err);
    res.status(500).render("error", { message: "Failed to load edit form" });
  }
});

// Update policy and recalculate commissions
router.post("/:id/update", ensureAuthenticated, async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    const { client_id, policy_type, start_date, end_date, premium } = req.body;

    const client = await prisma.clients.findUnique({
      where: { id: parseInt(client_id) },
    });
    if (!client || client.user_id !== req.session.user.id) {
      return res
        .status(403)
        .render("error", { message: "Unauthorized client selection" });
    }

    await prisma.policies.update({
      where: { id: policyId },
      data: {
        client_id: parseInt(client_id),
        policy_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        premium: parseFloat(premium),
      },
    });

    // Delete old commissions and recalculate fresh ones
    await prisma.commissions.deleteMany({ where: { policy_id: policyId } });
    await distributeCommissions(
      req.session.user.id,
      policyId,
      parseFloat(premium),
      policy_type
    );

    res.redirect("/policy");
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).render("error", { message: "Failed to update policy" });
  }
});

// Delete policy and its commissions
router.post("/:id/delete", ensureAuthenticated, async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    await prisma.$transaction([
      prisma.commissions.deleteMany({ where: { policy_id: policyId } }),
      prisma.policies.delete({ where: { id: policyId } }),
    ]);
    res.redirect("/policy");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).render("error", { message: "Failed to delete policy" });
  }
});

// Toggle policy status
router.post("/:id/toggle-status", ensureAuthenticated, async (req, res) => {
  try {
    const validStatuses = { activate: "active", deactivate: "inactive" };
    const newStatus = validStatuses[req.body.status];

    if (!newStatus) {
      return res.status(400).render("error", { message: "Invalid action" });
    }

    await prisma.policies.update({
      where: { id: parseInt(req.params.id) },
      data: { status: newStatus },
    });

    res.redirect("/policy");
  } catch (err) {
    console.error("Status toggle error:", err);
    res.status(500).render("error", { message: "Failed to update status" });
  }
});

module.exports = router;
