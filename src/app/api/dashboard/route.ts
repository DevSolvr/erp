import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const projectWhere =
    role === "EXTERNAL"
      ? { projectAccess: { some: { userId } } }
      : {};

  const [totalProjects, activeProjects, completedProjects, totalTasks, todoTasks, inProgressTasks, doneTasks, totalClients, transactions, recentProjects, recentTasks] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.project.count({ where: { ...projectWhere, status: "IN_PROGRESS" } }),
    prisma.project.count({ where: { ...projectWhere, status: "COMPLETED" } }),
    prisma.task.count({ where: role === "EXTERNAL" ? { project: { projectAccess: { some: { userId } } } } : {} }),
    prisma.task.count({ where: { ...(role === "EXTERNAL" ? { project: { projectAccess: { some: { userId } } } } : {}), status: "TODO" } }),
    prisma.task.count({ where: { ...(role === "EXTERNAL" ? { project: { projectAccess: { some: { userId } } } } : {}), status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { ...(role === "EXTERNAL" ? { project: { projectAccess: { some: { userId } } } } : {}), status: "DONE" } }),
    role !== "EXTERNAL" ? prisma.client.count() : Promise.resolve(0),
    role === "ADMIN" ? prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 50 }) : Promise.resolve([]),
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { client: true, _count: { select: { tasks: true } } },
    }),
    prisma.task.findMany({
      where: role === "EXTERNAL" ? { project: { projectAccess: { some: { userId } } } } : {},
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { project: { select: { name: true, color: true } }, assignee: { select: { name: true } } },
    }),
  ]);

  const income = (transactions as any[]).filter((t) => t.type === "INCOME").reduce((sum: number, t: any) => sum + t.amount, 0);
  const expense = (transactions as any[]).filter((t) => t.type === "EXPENSE").reduce((sum: number, t: any) => sum + t.amount, 0);

  return NextResponse.json({
    projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
    tasks: { total: totalTasks, todo: todoTasks, inProgress: inProgressTasks, done: doneTasks },
    clients: { total: totalClients },
    finance: { income, expense, balance: income - expense },
    recentProjects,
    recentTasks,
  });
}
