import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  const currentId = (session.user as any).id;
  const { id } = await params;

  if (role !== "ADMIN" && currentId !== id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const { name, email, password, userRole, active, projectIds } = body;

  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = await bcrypt.hash(password, 12);
  if (userRole && role === "ADMIN") data.role = userRole;
  if (active !== undefined && role === "ADMIN") data.active = active;

  if (projectIds !== undefined && role === "ADMIN") {
    await prisma.projectAccess.deleteMany({ where: { userId: id } });
    if (projectIds.length > 0) {
      await prisma.projectAccess.createMany({
        data: projectIds.map((pid: string) => ({ userId: id, projectId: pid })),
      });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const currentId = (session.user as any).id;
  const { id } = await params;

  if (currentId === id) return NextResponse.json({ error: "Não pode excluir sua própria conta" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
