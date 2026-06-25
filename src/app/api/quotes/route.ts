import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
  const status = req.nextUrl.searchParams.get("status") || undefined;

  const quotes = await prisma.quote.findMany({
    where: { ...(projectId ? { projectId } : {}), ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true, color: true } },
      items: true,
      _count: { select: { orders: true, contracts: true } },
    },
  });

  return NextResponse.json(quotes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const { title, clientName, clientEmail, projectId, notes, validUntil, items } = body;
  if (!title || !clientName) return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

  const count = await prisma.quote.count();
  const total = (items || []).reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  const quote = await prisma.quote.create({
    data: {
      number: `ORC-${String(count + 1).padStart(4, "0")}`,
      title,
      clientName,
      clientEmail: clientEmail || null,
      projectId: projectId || null,
      status: "DRAFT",
      notes: notes || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      total,
      items: { create: (items || []).map((i: any) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })) },
    },
    include: { project: true, items: true },
  });

  return NextResponse.json(quote, { status: 201 });
}
