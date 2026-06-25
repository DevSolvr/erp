import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;

  const secrets = await prisma.projectSecret.findMany({
    where: { projectId: id },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(secrets);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const { label, value, category, notes } = body;
  if (!label || !value) return NextResponse.json({ error: "Label e valor são obrigatórios" }, { status: 400 });

  const secret = await prisma.projectSecret.create({
    data: { projectId: id, label, value, category: category || "OTHER", notes: notes || null },
  });
  return NextResponse.json(secret, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const secretId = req.nextUrl.searchParams.get("secretId");
  if (!secretId) return NextResponse.json({ error: "secretId obrigatório" }, { status: 400 });

  await prisma.projectSecret.delete({ where: { id: secretId } });
  return NextResponse.json({ ok: true });
}
