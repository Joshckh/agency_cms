// export.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  try {
    // Replace 'yourModel' with your actual model name (case-sensitive)
    // Example: if your model is 'User' in schema.prisma, use prisma.user
    const data = await prisma.users.findMany();

    fs.writeFileSync("export.json", JSON.stringify(data, null, 2));
    console.log(
      `✅ Successfully exported ${data.length} records to export.json`
    );
  } catch (error) {
    console.error("❌ Export failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
