const pool = require("../db");

const calculateCommission = async (policyId, userId) => {
  try {
    const policyResult = await pool.query(
      "SELECT * FROM policies WHERE id = $1 AND user_id = $2",
      [policyId, userId]
    );

    if (policyResult.rowCount === 0) {
      return { error: "Policy not found" };
    }

    const policy = policyResult.rows[0];

    // ✅ Get agent's rank (from users table)
    const userResult = await pool.query(
      "SELECT rank_id FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rowCount === 0) {
      return { error: "User not found" };
    }

    const rankId = userResult.rows[0].rank_id;

    // ✅ Find commission rate based on rank and policy type
    const commissionRateResult = await pool.query(
      "SELECT rate FROM commission_rates WHERE rank_id = $1 AND policy_type = $2",
      [rankId, policy.policy_type]
    );

    if (commissionRateResult.rowCount === 0) {
      return { error: "Commission rate not found" };
    }

    const rate = parseFloat(commissionRateResult.rows[0].rate);
    const premium = parseFloat(policy.premium);

    const commissionAmount = (premium * rate) / 100;
    console.log(`Commission Amount: ${commissionAmount}`);
    return { commission: commissionAmount };
  } catch (err) {
    console.error(err.message);
    return { error: "Error calculating commission" };
  }
};

module.exports = { calculateCommission };
