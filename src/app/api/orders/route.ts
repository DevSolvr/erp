import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
  const status = req.nextUrl.searchParams.get("status") || undefined;

  const orders = await prisma.order.findMany({
    where: { ...(projectId ? { projectId } : {}), ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true, color: true } },
      quote: { select: { id: true, number: true, title: true } },
    },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const { title, clientName, projectId, quoteId, description, total } = body;
  if (!title || !clientName) return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

  const count = await prisma.order.count();

  const order = await prisma.order.create({
    data: {
      number: `PED-${String(count + 1).padStart(4, "0")}`,
      title,
      clientName,
      projectId: projectId || null,
      quoteId: quoteId || null,
      status: "PENDING",
      description: description || null,
      total: Number(total) || 0,
    },
    include: { project: true, quote: true },
  });

  return NextResponse.json(order, { status: 201 });
}
