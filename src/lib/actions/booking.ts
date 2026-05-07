"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookingSchema, cancelSchema } from "@/lib/validators";
import { sendTelegramMessage } from "@/lib/telegram";

export async function bookSlot(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("No autenticado");
  }

  const parsed = bookingSchema.parse({
    slotId: String(formData.get("slotId") ?? ""),
  });

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (user.classCredits <= 0) {
      throw new Error("Sin créditos disponibles");
    }

    let updatedSlot;
    try {
      updatedSlot = await tx.classSlot.update({
        where: { id: parsed.slotId, status: "AVAILABLE" },
        data: {
          status: "BOOKED",
          studentId: user.id,
        },
      });
    } catch {
      throw new Error("Cupo no disponible");
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        classCredits: { decrement: 1 },
        totalClassesTaken: { increment: 1 },
      },
    });

    sendTelegramMessage(
      `Reserva confirmada para ${user.email} en ${updatedSlot.startTime.toLocaleString("es-CL")}.`,
    );

    return updatedSlot;
  });
}

export async function cancelSlot(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("No autenticado");
  }

  const parsed = cancelSchema.parse({
    slotId: String(formData.get("slotId") ?? ""),
  });

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    let updatedSlot;
    try {
      updatedSlot = await tx.classSlot.update({
        where: { id: parsed.slotId, studentId: user.id, status: "BOOKED" },
        data: {
          status: "AVAILABLE",
          studentId: null,
        },
      });
    } catch {
      throw new Error("No puedes cancelar este cupo");
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        classCredits: { increment: 1 },
      },
    });

    sendTelegramMessage(
      `Reserva cancelada por ${user.email} para ${updatedSlot.startTime.toLocaleString("es-CL")}.`,
    );

    return updatedSlot;
  });
}
