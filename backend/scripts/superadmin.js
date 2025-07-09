const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();
async function createSuperAdmin() {
  const name = "Super Admin";
  const email = "asd";
  const password = "asd";
  const role = "superadmin";

  try {
    const existing = await prisma.users.findFirst({
      where: { role: "superadmin" },
    });

    if (existing) {
      console.log("Superadmin already exists. Aborting...");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role,
      },
    });
    console.log("Superadmin created!");
  } catch (err) {
    console.error("Error creating superadmin:", err);
  }
}

createSuperAdmin();
