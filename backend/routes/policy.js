const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");

router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id; // Retrieve user ID from session
    const policiesResult = await pool.query(
      "SELECT * FROM policies WHERE user_id = $1",
      [userId]
    );

    const policyList = policiesResult.rows || []; // Store the results in a variable, default to empty array if no policies

    res.render("policy/index", {
      user: req.session.user,
      policies: policyList,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/create", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id; // Retrieve user ID from session
    const clientsResult = await pool.query(
      "SELECT * FROM clients WHERE user_id = $1",
      [userId]
    );

    const clientList = clientsResult.rows || []; // Store the results in a variable, default to empty array if no clients
    res.render("policy/create", {
      user: req.session.user,
      clients: clientList,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/create", ensureAuthenticated, async (req, res) => {
  try {
    let user_id = req.session.user.id; // Retrieve user ID from session
    const { client_id, policy_type, start_date, end_date, premium } = req.body;

    console.log(`Received data:`, {
      client_id,
      policy_type,
      start_date,
      end_date,
      premium,
    });

    // Check if the client is under this user's clients first.
    const checkClientResult = await pool.query(
      "SELECT * FROM clients WHERE id = $1 AND user_id = $2",
      [client_id, user_id]
    );

    console.log(`Check Client Result:`, checkClientResult);

    if (checkClientResult.rowCount === 0) {
      // Client not found or doesn't belong to this user
      res.status(403).send("Unauthorized client selection");
      return;
    }

    await pool.query(
      "INSERT INTO policies (client_id, user_id, policy_type, start_date, end_date, premium) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        client_id,
        user_id,
        policy_type,
        start_date,
        end_date,
        parseFloat(premium),
      ]
    );

    console.log("Policy inserted successfully");

    res.redirect("/policy");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/:id/edit", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id; // Retrieve user ID from session
    const policyId = req.params.id;

    const clientListResult = await pool.query(
      "SELECT * FROM clients WHERE user_id = $1",
      [userId]
    );
    const policyDetailsResult = await pool.query(
      "SELECT * FROM policies WHERE id = $1 AND user_id = $2",
      [policyId, userId]
    );

    const clientList = clientListResult.rows || [];
    const policyDetails = policyDetailsResult.rows[0] || null;

    if (!policyDetails) {
      return res.status(404).send("Policy not found");
    }

    res.render("policy/edit", {
      user: req.session.user,
      clients: clientList,
      policy: policyDetails,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/:id/update", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const policyId = req.params.id;

    const { client_id, policy_type, start_date, end_date, premium } = req.body;

    // Check if the client is under this user's clients first.
    const checkClientResult = await pool.query(
      "SELECT * FROM clients WHERE id = $1 AND user_id = $2",
      [client_id, userId]
    );

    console.log(`Check Client Result:`, checkClientResult);

    if (checkClientResult.rowCount === 0) {
      // Client not found or doesn't belong to this user
      res.status(403).send("Unauthorized client selection");
      return;
    }

    await pool.query(
      "UPDATE policies SET client_id = $1, policy_type = $2, start_date = $3, end_date = $4, premium = $5 WHERE id = $6 AND user_id = $7",
      [
        client_id,
        policy_type,
        start_date,
        end_date,
        parseFloat(premium),
        policyId,
        userId,
      ]
    );

    console.log("Policy updated successfully");

    res.redirect("/policy");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/:id/delete", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const policyId = req.params.id;

    await pool.query("DELETE FROM policies WHERE id = $1 AND user_id = $2", [
      policyId,
      userId,
    ]);

    console.log("Policy deleted successfully");

    res.redirect("/policy");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/:id/toggle-status", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const policyId = req.params.id;
    const { status } = req.body;

    if (!["activate", "deactivate"].includes(status)) {
      return res.status(400).send("Invalid action");
    }

    // Update the status of the policy
    await pool.query(
      "UPDATE policies SET status = $1 WHERE id = $2 AND user_id = $3",
      [status === "activate" ? "active" : "inactive", policyId, userId]
    );

    console.log(`Policy status updated to ${status} successfully`);

    res.redirect("/policy");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
