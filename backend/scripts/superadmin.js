const pool = require("../db");
const bcrypt = require("bcrypt");

async function createSuperAdmin() {
  const name = "Super Admin";
  const email = "admin@admin.com";
  const password = "testing123!";
  const role = "superadmin";

  try {
    const existing = await pool.query(
      "SELECT * FROM users WHERE role = 'superadmin'"
    );

    if (existing.rows.length > 0) {
      console.log("Superadmin already exists. Aborting...");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, role]
    );

    console.log("Superadmin created!");
  } catch (err) {
    console.error("Error creating superadmin:", err);
  }
}

createSuperAdmin();
