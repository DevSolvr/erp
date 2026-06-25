const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const p = new PrismaClient();

async function main() {
  const existing = await p.user.findFirst({ where: { role: "ADMIN" } });
  if (existing) {
    console.log("Admin já existe:", existing.email);
    return;
  }
  const hash = await bcrypt.hash("admin123", 12);
  const user = await p.user.create({
    data: {
      name: "Admin DevSolvr",
      email: "admin@devsolvr.com",
      password: hash,
      role: "ADMIN",
    },
  });
  console.log("Admin criado:", user.email, "/ senha: admin123");
}

main().catch(console.error).finally(() => p.$disconnect());
