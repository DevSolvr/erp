import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const role   = (session.user as any).role;

  // Visibility rules:
  // ALL      → todos veem
  // EMPLOYEES → admin + collaborator
  // EXTERNAL  → external + admin (admin vê tudo que criou)
  // PERSONAL  → só quem criou
  let visibilityFilter: string[];
  if (role === "ADMIN") {
    // Admin vê tudo que ele criou (incluindo PERSONAL)
    // + eventos ALL e EMPLOYEES de qualquer admin
    const events = await prisma.agendaEvent.findMany({
      where: {
        OR: [
          { visibility: "ALL" },
          { visibility: "EMPLOYEES" },
          { visibility: "EXTERNAL" },
          { visibility: "PERSONAL", createdById: userId },
        ],
      },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(events);
  }

  if (role === "COLLABORATOR") {
    visibilityFilter = ["ALL", "EMPLOYEES"];
  } else {
    // EXTERNAL
    visibilityFilter = ["ALL", "EXTERNAL"];
  }

  const events = await prisma.agendaEvent.findMany({
    where: { visibility: { in: visibilityFilter } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role   = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { title, description, date, endDate, visibility, color } = body;

  if (!title || !date) return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 });

  const event = await prisma.agendaEvent.create({
    data: {
      title,
      description: description || null,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      visibility: visibility || "ALL",
      color: color || "#10d9a0",
      createdById: userId,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  await prisma.agendaEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
