import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const updates = await prisma.projectUpdate.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(updates);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const { title, content, isPublic } = body;
  if (!title || !content) return NextResponse.json({ error: "Título e conteúdo são obrigatórios" }, { status: 400 });

  const update = await prisma.projectUpdate.create({
    data: { projectId: id, title, content, isPublic: isPublic !== false },
  });
  return NextResponse.json(update, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const updateId = req.nextUrl.searchParams.get("updateId");
  if (!updateId) return NextResponse.json({ error: "updateId obrigatório" }, { status: 400 });

  await prisma.projectUpdate.delete({ where: { id: updateId } });
  return NextResponse.json({ ok: true });
}
