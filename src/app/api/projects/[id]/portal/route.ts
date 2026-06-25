import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "EXTERNAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const { action } = body; // "enable" | "disable" | "regenerate"

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  if (action === "disable") {
    const updated = await prisma.project.update({ where: { id }, data: { portalEnabled: false } });
    return NextResponse.json({ portalEnabled: false, portalToken: updated.portalToken });
  }

  const token = project.portalToken || randomBytes(20).toString("hex");
  const updated = await prisma.project.update({
    where: { id },
    data: { portalEnabled: true, portalToken: token },
  });

  return NextResponse.json({ portalEnabled: true, portalToken: updated.portalToken });
}
