import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    include: { project: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const { description, amount, type, subtype, clientName, reason, projectId, category, date, dueDate, isPaid } = body;

  if (!description || !amount || !type) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      description,
      amount: Number(amount),
      type,
      subtype: subtype || null,
      clientName: clientName || null,
      reason: reason || null,
      projectId: projectId || null,
      category: category || null,
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      isPaid: Boolean(isPaid),
    },
    include: { project: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(transaction, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const body = await req.json();
  const transaction = await prisma.transaction.update({
    where: { id },
    data: body,
    include: { project: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
