const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ensureAuthenticated } = require("../middleware/auth");

// Helper function
const calculateCommission = (premium, rate) =>
  (premium * parseFloat(rate)) / 100;

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

    // Get user and their rank
    const user = await prisma.users.findUnique({ where: { id: userId } });

    // Get commission rates based on user rank
    const commissionRates = await prisma.commission_rates.findMany({
      where: { rank_id: user.rank_id },
    });

    // Get all clients for this agent
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

// Update policy
router.post("/:id/update", ensureAuthenticated, async (req, res) => {
  try {
    const { client_id, policy_type, start_date, end_date, premium } = req.body;
    const policyId = parseInt(req.params.id);

    // Verify client belongs to user
    const client = await prisma.clients.findUnique({
      where: { id: parseInt(client_id) },
    });

    if (!client || client.user_id !== req.session.user.id) {
      return res
        .status(403)
        .render("error", { message: "Unauthorized client selection" });
    }

    // Update policy
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

    // Update commission if rate exists
    const rate = await prisma.commission_rates.findFirst({
      where: {
        rank_id: req.session.user.rank_id,
        policy_type,
      },
    });

    if (rate) {
      await prisma.commissions.upsert({
        where: { policy_id: policyId },
        update: {
          amount: calculateCommission(parseFloat(premium), rate.rate),
        },
        create: {
          user_id: req.session.user.id,
          policy_id: policyId,
          amount: calculateCommission(parseFloat(premium), rate.rate),
        },
      });
    }

    res.redirect("/policy");
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).render("error", { message: "Failed to update policy" });
  }
});

// Delete policy
router.post("/:id/delete", ensureAuthenticated, async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.commissions.deleteMany({
        where: { policy_id: parseInt(req.params.id) },
      }),
      prisma.policies.delete({ where: { id: parseInt(req.params.id) } }),
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

router.post("/create", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { client_id, policy_type, start_date, end_date, premium } = req.body;

    // Verify client belongs to user
    const client = await prisma.clients.findUnique({
      where: { id: parseInt(client_id) },
    });

    if (!client || client.user_id !== userId) {
      return res
        .status(403)
        .render("error", { message: "Unauthorized client selection" });
    }

    // Create policy
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

    // Create commission if rate exists
    const rate = await prisma.commission_rates.findFirst({
      where: {
        rank_id: req.session.user.rank_id,
        policy_type,
      },
    });

    if (rate) {
      await prisma.commissions.create({
        data: {
          user_id: userId,
          policy_id: newPolicy.id,
          amount: calculateCommission(parseFloat(premium), rate.rate),
        },
      });
    }

    res.redirect("/policy");
  } catch (err) {
    console.error("Policy creation error:", err);
    res.status(500).render("error", { message: "Failed to create policy" });
  }
});
module.exports = router;
