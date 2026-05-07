import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "No permitido" }, { status: 403 });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;

  if (!adminEmail) {
    return NextResponse.json(
      { error: "SEED_ADMIN_EMAIL no configurado" },
      { status: 400 },
    );
  }

  const whitelist = await prisma.whitelist.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, role: "ADMIN", name: "Admin" },
  });

  return NextResponse.json({ whitelist, adminUser });
}
