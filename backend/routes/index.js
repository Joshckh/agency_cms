const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  let login = false;
  try {
    if (login === false) {
      res.redirect("/auth/login");
    } else {
      res.redirect("/client");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
