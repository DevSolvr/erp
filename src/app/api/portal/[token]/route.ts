import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const project = await prisma.project.findUnique({
    where: { portalToken: token },
    include: {
      client: { select: { name: true, company: true } },
      updates: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      tasks: {
        select: { status: true },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!project || !project.portalEnabled) {
    return NextResponse.json({ error: "Portal não encontrado ou inativo" }, { status: 404 });
  }

  const taskStats = {
    total: project.tasks.length,
    done: project.tasks.filter((t) => t.status === "DONE").length,
    inProgress: project.tasks.filter((t) => t.status === "IN_PROGRESS").length,
    todo: project.tasks.filter((t) => t.status === "TODO").length,
  };

  return NextResponse.json({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    startDate: project.startDate,
    endDate: project.endDate,
    techStack: project.techStack,
    color: project.color,
    client: project.client,
    updates: project.updates,
    taskStats,
  });
}
