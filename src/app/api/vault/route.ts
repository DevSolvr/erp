import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const items = await prisma.vaultItem.findMany({
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { label, value, category, notes } = await req.json();
  if (!label || !value) return NextResponse.json({ error: "Label e valor obrigatórios" }, { status: 400 });

  const item = await prisma.vaultItem.create({
    data: { label, value, category: category || "OTHER", notes: notes || null },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  await prisma.vaultItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
