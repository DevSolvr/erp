import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const projectId = req.nextUrl.searchParams.get("projectId");

  const where: any = {
    ...(role === "EXTERNAL" ? { project: { projectAccess: { some: { userId } } } } : {}),
    ...(projectId ? { projectId } : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, description, status, priority, dueDate, projectId, assigneeId } = body;

  if (!title || !projectId) return NextResponse.json({ error: "Título e projeto são obrigatórios" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      assigneeId: assigneeId || null,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
