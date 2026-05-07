import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "No permitido" }, { status: 403 });
  }

  const rawAdmins = process.env.SEED_ADMIN_EMAIL;
  const rawStudents = process.env.SEED_STUDENT_EMAILS;

  if (!rawAdmins) {
    return NextResponse.json(
      { error: "SEED_ADMIN_EMAIL no configurado" },
      { status: 400 },
    );
  }

  const admins = rawAdmins
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  const students = (rawStudents ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (admins.length === 0) {
    return NextResponse.json({ error: "SEED_ADMIN_EMAIL vacío" }, { status: 400 });
  }

  const allEmails = Array.from(new Set([...admins, ...students]));

  const results = await prisma.$transaction(async (tx) => {
    const whitelist = await Promise.all(
      allEmails.map((email) =>
        tx.whitelist.upsert({
          where: { email },
          update: {},
          create: { email },
        }),
      ),
    );

    const adminUsers = await Promise.all(
      admins.map((email) =>
        tx.user.upsert({
          where: { email },
          update: { role: "ADMIN" },
          create: { email, role: "ADMIN" },
        }),
      ),
    );

    const studentUsers = await Promise.all(
      students.map((email) =>
        tx.user.upsert({
          where: { email },
          update: { role: "STUDENT" },
          create: { email, role: "STUDENT" },
        }),
      ),
    );

    return { whitelist, adminUsers, studentUsers };
  });

  return NextResponse.json(results);
}
