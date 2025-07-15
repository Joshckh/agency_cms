const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

// Register a user with their rank and role.
router.get("/register", async (req, res) => {
  try {
    const ranks = await prisma.ranks.findMany({
      select: { id: true, role_name: true },
    });
    res.render("superadmin/register", { ranks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, rankId, recruiterId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role,
        rank_id: parseInt(rankId),
        recruiter_id: recruiterId ? parseInt(recruiterId) : 1, // default to agency
      },
    });
    res.redirect("/dashboard/superadmin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/ranks", async (req, res) => {
  try {
    const ranks = await prisma.ranks.findMany({
      select: { id: true, role_name: true },
    });
    res.render("superadmin/ranks", { ranks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/ranks", async (req, res) => {
  try {
    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).send("Missing roleName in request body");
    }

    const newRank = await prisma.ranks.create({
      data: {
        role_name: roleName,
      },
    });

    res.redirect("/superadmin/ranks");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/commission-rates", async (req, res) => {
  try {
    const ranks = await prisma.ranks.findMany({
      select: { id: true, role_name: true },
    });
    const commissionRates = await prisma.commission_rates.findMany({
      include: {
        ranks: {
          select: { role_name: true },
        },
      },
    });

    res.render("superadmin/commission", { ranks, commissionRates });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/commission-rates", async (req, res) => {
  try {
    const { rankId, policyType, primaryRate, secondaryRate } = req.body;
    if (!rankId || !policyType || isNaN(primaryRate) || isNaN(secondaryRate)) {
      return res.status(400).send("Missing or invalid fields");
    }

    await prisma.commission_rates.create({
      data: {
        rank_id: parseInt(rankId),
        policy_type: policyType,
        primary_rate: parseFloat(primaryRate),
        secondary_rate: parseFloat(secondaryRate),
      },
    });

    res.redirect("/superadmin/commission-rates");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/users", async (req, res) => {
  try {
    const query = req.query.query || "";
    let users;

    if (query) {
      users = await prisma.users.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          can_login: true,
        },
      });
    } else {
      users = await prisma.users.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          can_login: true,
        },
      });
    }

    res.render("superadmin/users", { users, query });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.users.update({
      where: { id },
      data: {
        status: "inactive",
        can_login: false,
      },
    });

    res.redirect("/superadmin/users");
  } catch (err) {
    console.error("User delete error:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/edit-user/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return res.status(404).send("User not found");

    const ranks = await prisma.ranks.findMany({
      select: { id: true, role_name: true },
    });

    const roles = [
      { value: "agent", text: "Agent" },
      { value: "admin", text: "Admin" },
    ];

    res.render("superadmin/editUser", { user, ranks, roles });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/edit-user/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, password, role, rankId } = req.body;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.users.update({
        where: { id },
        data: {
          name,
          email,
          password_hash: hashedPassword,
          role,
          rank_id: parseInt(rankId),
        },
      });
    } else {
      await prisma.users.update({
        where: { id },
        data: {
          name,
          email,
          role,
          rank_id: parseInt(rankId),
        },
      });
    }

    res.redirect("/superadmin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ✅ Toggle user activation status (MUST be outside any other route)
router.post("/users/:id/toggle-status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.users.findUnique({ where: { id } });

    const newStatus = user.status === "active" ? "inactive" : "active";
    const newLoginAbility = newStatus === "active";

    await prisma.users.update({
      where: { id },
      data: {
        status: newStatus,
        can_login: newLoginAbility,
      },
    });

    res.redirect("/superadmin/users");
  } catch (err) {
    console.error("Toggle user status error:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
