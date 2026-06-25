import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const projectWhere = role === "EXTERNAL" ? { projectAccess: { some: { userId } } } : {};

  const now = new Date();
  const pastDays = new Date(now); pastDays.setDate(pastDays.getDate() - 14);
  const futureDays = new Date(now); futureDays.setDate(futureDays.getDate() + 60);

  const [projects, tasks, transactions, quotes, orders, contracts] = await Promise.all([
    prisma.project.findMany({
      where: { ...projectWhere, OR: [{ startDate: { gte: pastDays, lte: futureDays } }, { endDate: { gte: pastDays, lte: futureDays } }] },
      select: { id: true, name: true, color: true, startDate: true, endDate: true, status: true },
    }),
    prisma.task.findMany({
      where: { dueDate: { gte: pastDays, lte: futureDays }, ...(role === "EXTERNAL" ? { project: { projectAccess: { some: { userId } } } } : {}) },
      select: { id: true, title: true, dueDate: true, status: true, priority: true, project: { select: { name: true, color: true } } },
    }),
    role === "ADMIN" ? prisma.transaction.findMany({
      where: { type: "INCOME", isPaid: false, dueDate: { gte: pastDays, lte: futureDays } },
      select: { id: true, description: true, dueDate: true, amount: true, clientName: true },
    }) : Promise.resolve([]),
    prisma.quote.findMany({
      where: { validUntil: { gte: pastDays, lte: futureDays } },
      select: { id: true, title: true, number: true, clientName: true, validUntil: true, status: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: pastDays } },
      select: { id: true, title: true, number: true, clientName: true, createdAt: true, status: true },
    }),
    prisma.contract.findMany({
      where: { OR: [{ startDate: { gte: pastDays, lte: futureDays } }, { endDate: { gte: pastDays, lte: futureDays } }] },
      select: { id: true, title: true, number: true, clientName: true, startDate: true, endDate: true, status: true, value: true },
    }),
  ]);

  const events: any[] = [];

  projects.forEach((p) => {
    if (p.startDate) events.push({ id: `ps-${p.id}`, type: "project", title: p.name, subtitle: "Início do projeto", date: p.startDate, status: p.status, color: p.color, link: `/projects/${p.id}` });
    if (p.endDate) events.push({ id: `pe-${p.id}`, type: "project_end", title: p.name, subtitle: "Prazo do projeto", date: p.endDate, status: p.status, color: p.color, link: `/projects/${p.id}` });
  });

  tasks.forEach((t) => {
    if (t.dueDate) events.push({ id: `t-${t.id}`, type: "task", title: t.title, subtitle: t.project?.name, date: t.dueDate, status: t.status, color: t.project?.color, priority: t.priority });
  });

  (transactions as any[]).forEach((t) => {
    if (t.dueDate) events.push({ id: `f-${t.id}`, type: "finance", title: t.description, subtitle: t.clientName ? `Cliente: ${t.clientName}` : "A receber", date: t.dueDate });
  });

  quotes.forEach((q) => {
    if (q.validUntil) events.push({ id: `q-${q.id}`, type: "quote", title: `${q.number} — ${q.title}`, subtitle: `Cliente: ${q.clientName}`, date: q.validUntil, status: q.status, link: `/quotes` });
  });

  contracts.forEach((c) => {
    if (c.startDate) events.push({ id: `cs-${c.id}`, type: "contract", title: `${c.number} — ${c.title}`, subtitle: `Início • ${c.clientName}`, date: c.startDate, status: c.status, link: `/contracts` });
    if (c.endDate) events.push({ id: `ce-${c.id}`, type: "contract_end", title: `${c.number} — ${c.title}`, subtitle: `Término • ${c.clientName}`, date: c.endDate, status: c.status, link: `/contracts` });
  });

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json(events);
}
