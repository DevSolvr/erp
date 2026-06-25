import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (existing) {
      return NextResponse.json({ message: "Admin já existe", email: existing.email });
    }

    const hashed = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.create({
      data: {
        name: "Admin DevSolvr",
        email: "admin@devsolvr.com",
        password: hashed,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Admin criado com sucesso!",
      email: admin.email,
      password: "admin123",
      note: "Mude a senha após o primeiro login!",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar admin" }, { status: 500 });
  }
}
