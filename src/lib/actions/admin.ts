"use server";

import { prisma } from "@/lib/prisma";
import {
  creditsSchema,
  generateSlotsSchema,
  weeklyTemplateSchema,
} from "@/lib/validators";
import { auth } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";

function assertAdmin(role?: string) {
  if (role !== "ADMIN") {
    throw new Error("No autorizado");
  }
}

export async function createWeeklyTemplate(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  const parsed = weeklyTemplateSchema.parse(input);
  return prisma.weeklyTemplate.create({ data: parsed });
}

export async function deleteWeeklyTemplate(id: string) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  return prisma.weeklyTemplate.delete({ where: { id } });
}

export async function generateSlots(input: {
  startDate: string;
  endDate: string;
}) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  const parsed = generateSlotsSchema.parse(input);
  const templates = await prisma.weeklyTemplate.findMany();

  const start = new Date(parsed.startDate);
  const end = new Date(parsed.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Fechas inválidas");
  }

  const slots = [] as {
    date: Date;
    startTime: Date;
    endTime: Date;
    status: "AVAILABLE";
  }[];

  const cursor = new Date(start);
  while (cursor <= end) {
    const dayOfWeek = cursor.getDay();
    const matches = templates.filter((tpl) => tpl.dayOfWeek === dayOfWeek);

    matches.forEach((template) => {
      const [startHour, startMinute] = template.startTime.split(":");
      const [endHour, endMinute] = template.endTime.split(":");
      const startTime = new Date(cursor);
      startTime.setHours(Number(startHour), Number(startMinute), 0, 0);

      const endTime = new Date(cursor);
      endTime.setHours(Number(endHour), Number(endMinute), 0, 0);

      if (startTime < endTime) {
        slots.push({
          date: new Date(cursor),
          startTime,
          endTime,
          status: "AVAILABLE",
        });
      }
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  const result = await prisma.classSlot.createMany({
    data: slots,
    skipDuplicates: true,
  });

  sendTelegramMessage(
    `Se generaron ${result.count} nuevos cupos desde el panel admin.`,
  );

  return result;
}

export async function updateCredits(input: {
  userId: string;
  classCredits: number;
}) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  const parsed = creditsSchema.parse(input);

  return prisma.user.update({
    where: { id: parsed.userId },
    data: { classCredits: parsed.classCredits },
  });
}
