import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { project: true, items: true, orders: true, contracts: true },
  });
  if (!quote) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(quote);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const { items, ...rest } = body;

  const quote = await prisma.quote.update({
    where: { id },
    data: {
      ...rest,
      ...(rest.validUntil ? { validUntil: new Date(rest.validUntil) } : {}),
      ...(items ? {
        items: {
          deleteMany: {},
          create: items.map((i: any) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        },
        total: items.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unitPrice), 0),
      } : {}),
    },
    include: { project: true, items: true },
  });

  return NextResponse.json(quote);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;

  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
