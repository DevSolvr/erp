import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const { name, email, phone, company, website, notes } = body;

  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const client = await prisma.client.create({
    data: { name, email: email || null, phone: phone || null, company: company || null, website: website || null, notes: notes || null },
    include: { _count: { select: { projects: true } } },
  });

  return NextResponse.json(client, { status: 201 });
}
