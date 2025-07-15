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
  let currentUser = await prisma.users.findUnique({
    where: { id: userId },
    include: { recruiter: true },
  });

  const visited = new Set();
  let level = 0;

  while (currentUser && !visited.has(currentUser.id)) {
    visited.add(currentUser.id);

    const commissionRate = await prisma.commission_rates.findFirst({
      where: {
        rank_id: currentUser.rank_id,
        policy_type: policyType,
      },
    });

    if (commissionRate) {
      const rateToUse =
        level === 0
          ? commissionRate.primary_rate
          : commissionRate.secondary_rate;
      if (rateToUse) {
        await prisma.commissions.create({
          data: {
            user_id: currentUser.id,
            policy_id: policyId,
            amount: calculateCommission(premium, rateToUse),
            commission_type: level === 0 ? "primary" : "secondary",
          },
        });
      }
    }

    currentUser = currentUser.recruiter;
    level++;
  }

  // Final fallback to agency (user_id = 1) if not already included
  if (!visited.has(1)) {
    const agency = await prisma.users.findUnique({ where: { id: 1 } });

    const agencyRate = await prisma.commission_rates.findFirst({
      where: {
        rank_id: agency.rank_id,
        policy_type: policyType,
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
