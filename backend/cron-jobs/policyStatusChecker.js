const { PrismaClient } = require("@prisma/client");
const nodeCron = require("node-cron");

const prisma = new PrismaClient();

async function checkPolicyStatus() {
  try {
    const policies = await prisma.policies.findMany();
    const currentDate = new Date();

    for (const policy of policies) {
      const startDate = new Date(policy.start_date);
      const endDate = new Date(policy.end_date);

      const newStatus =
        currentDate >= startDate && currentDate <= endDate
          ? "active"
          : "inactive";
      if (policy.status !== newStatus) {
        await prisma.policies.update({
          where: { id: policy.id },
          data: { status: newStatus },
        });
        console.log(`Updated policy ${policy.id} to ${newStatus}`);
      }
    }
  } catch (err) {
    console.error("Policy status update failed:", err.message);
  }
}

// Schedule to run every day at 12:00 PM
function startPolicyStatusCron() {
  nodeCron.schedule("0 12 * * *", checkPolicyStatus);
  console.log("Policy status cron job scheduled for 12:00 PM daily.");
}

module.exports = { startPolicyStatusCron, checkPolicyStatus };
