import { z } from "zod";

export const weeklyTemplateSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  })
  .refine(
    (value) => value.startTime < value.endTime,
    "Hora de término debe ser posterior",
  );

export const generateSlotsSchema = z
  .object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  })
  .refine((value) => value.startDate <= value.endDate, "Rango inválido");

export const bookingSchema = z.object({
  slotId: z.string().uuid(),
});

export const cancelSchema = z.object({
  slotId: z.string().uuid(),
});

export const creditsSchema = z.object({
  userId: z.string().uuid(),
  classCredits: z.number().int().min(0),
});
