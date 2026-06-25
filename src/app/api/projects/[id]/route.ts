import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      tasks: { include: { assignee: { select: { id: true, name: true, avatar: true } }, _count: { select: { comments: true } } }, orderBy: { createdAt: "asc" } },
      projectAccess: { include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } } },
    },
  });

  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  if (role === "EXTERNAL") {
    const hasAccess = project.projectAccess.some((pa) => pa.userId === userId);
    if (!hasAccess) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
  }

  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, status, priority, startDate, endDate, budget, spent, progress, techStack, color, clientId } = body;

  const project = await prisma.project.update({
    where: { id },
    data: {
      name,
      description: description || null,
      status,
      priority,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      budget: budget ? Number(budget) : null,
      spent: spent ? Number(spent) : 0,
      progress: Number(progress) || 0,
      techStack: techStack || null,
      color: color || "#7c3aed",
      clientId: clientId || null,
    },
    include: { client: true, _count: { select: { tasks: true } } },
  });

  return NextResponse.json(project);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Apenas admin pode excluir projetos" }, { status: 403 });

  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
