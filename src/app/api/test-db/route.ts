import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true, active: true },
    });
    return NextResponse.json({ ok: true, userCount, users });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
