import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await sendTelegramMessage("Test de Telegram desde el panel admin.");

  return NextResponse.json({ ok: true });
}
