const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Simple helper to calculate commission amount
 * @param {number} premium - Policy premium amount
 * @param {number} rate - Percentage rate (e.g. 10 for 10%)
 * @returns {number}
 */
const calculateCommission = (premium, rate) => {
  return (premium * parseFloat(rate)) / 100;
};

/**
 * Recursively distribute commissions up the upline chain.
 * Each recruiter in the chain (up to agency) gets a secondary commission.
 * The selling agent gets a primary commission.
 * The agency (user_id = 1) always gets a secondary cut as well.
 */
async function distributeRecursiveCommissions(
  userId,
  policyId,
  premium,
  policyType
) {
  const visited = new Set();

  async function walk(currentUserId, isFirst = true) {
    if (!currentUserId || visited.has(currentUserId)) return;
    visited.add(currentUserId);

    const user = await prisma.users.findUnique({
      where: { id: currentUserId },
      include: { ranks: true }, // rank needed for rates
    });

    if (!user || !user.rank_id) return;

    const rate = await prisma.commission_rates.findFirst({
      where: {
        rank_id: user.rank_id,
        policy_type: policyType,
      },
    });

    if (!rate) return;

    const commissionAmount = isFirst
      ? (premium * rate.primary_rate) / 100
      : (premium * rate.secondary_rate) / 100;

    await prisma.commissions.create({
      data: {
        user_id: user.id,
        policy_id: policyId,
        amount: commissionAmount.toFixed(2),
        commission_type: isFirst ? "primary" : "secondary",
      },
    });

    // Recurse to recruiter
    if (user.recruiter_id !== null) {
      await walk(user.recruiter_id, false);
    }
  }

  await walk(userId);

  // Finally add the agency (user ID 1) if not visited yet
  if (!visited.has(1)) {
    const agencyRate = await prisma.commission_rates.findFirst({
      where: {
        rank_id: 3, // Assuming rank_id: 3 is for agency
        policy_type: policyType,
      },
    });

    if (agencyRate) {
      const agencyAmount = (premium * agencyRate.secondary_rate) / 100;
      await prisma.commissions.create({
        data: {
          user_id: 1,
          policy_id: policyId,
          amount: agencyAmount.toFixed(2),
          commission_type: "secondary",
        },
      });
    }
  }

  console.log("==== COMMISSION CHAIN START ====");
  console.log("Visited IDs:", [...visited]);
  console.log("==== COMMISSION CHAIN END ====");
}

/**
 * Only distribute commission to the immediate recruiter and the agency.
 * The agent gets a primary commission.
 * The recruiter and agency get secondary commissions.
 */
async function distributeImmediateCommissions(
  userId,
  policyId,
  premium,
  policyType
) {
  const currentUser = await prisma.users.findUnique({
    where: { id: userId },
    include: { recruiter: true },
  });

  // Commission for current agent (primary)
  const rate = await prisma.commission_rates.findFirst({
    where: {
      rank_id: currentUser.rank_id,
      policy_type,
    },
  });

  if (rate?.primary_rate) {
    await prisma.commissions.create({
      data: {
        user_id,
        policy_id: policyId,
        amount: calculateCommission(premium, rate.primary_rate),
        commission_type: "primary",
      },
    });
  }

  // Commission for direct recruiter (secondary)
  if (currentUser.recruiter) {
    const recruiterRate = await prisma.commission_rates.findFirst({
      where: {
        rank_id: currentUser.recruiter.rank_id,
        policy_type,
      },
    });

    if (recruiterRate?.secondary_rate) {
      await prisma.commissions.create({
        data: {
          user_id: currentUser.recruiter.id,
          policy_id: policyId,
          amount: calculateCommission(premium, recruiterRate.secondary_rate),
          commission_type: "secondary",
        },
      });
    }
  }

  // Commission for agency (secondary)
  if (userId !== 1) {
    const agency = await prisma.users.findUnique({ where: { id: 1 } });

    const agencyRate = await prisma.commission_rates.findFirst({
      where: {
        rank_id: agency.rank_id,
        policy_type,
      },
    });

    if (agencyRate?.secondary_rate) {
      await prisma.commissions.create({
        data: {
          user_id: 1,
          policy_id: policyId,
          amount: calculateCommission(premium, agencyRate.secondary_rate),
          commission_type: "secondary",
        },
      });
    }
  }
}

module.exports = {
  calculateCommission,
  distributeRecursiveCommissions,
  distributeImmediateCommissions,
};
