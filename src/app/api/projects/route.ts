import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const search = req.nextUrl.searchParams.get("search") || "";
  const status = req.nextUrl.searchParams.get("status") || "";

  const where: any = {
    ...(role === "EXTERNAL" ? { projectAccess: { some: { userId } } } : {}),
    ...(search ? { name: { contains: search } } : {}),
    ...(status ? { status } : {}),
  };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      client: true,
      _count: { select: { tasks: true } },
      projectAccess: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const { name, description, status, priority, startDate, endDate, budget, progress, techStack, color, clientId } = body;

  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      status: status || "PLANNING",
      priority: priority || "MEDIUM",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      budget: budget ? Number(budget) : null,
      progress: progress ? Number(progress) : 0,
      techStack: techStack || null,
      color: color || "#7c3aed",
      clientId: clientId || null,
    },
    include: { client: true, _count: { select: { tasks: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}
