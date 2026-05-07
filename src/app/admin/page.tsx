import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlots, updateCredits } from "@/lib/actions/admin";
import AdminTemplatesClient from "@/app/admin/AdminTemplatesClient";
import { ensureEnv, formatDate, toTimeString } from "@/lib/utils";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const [templates, users, upcomingSlots] = await Promise.all([
    prisma.weeklyTemplate.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.classSlot.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { startTime: "asc" },
      take: 8,
    }),
  ]);

  const templateData = templates.map((template) => ({
    id: template.id,
    dayOfWeek: template.dayOfWeek,
    startTime: template.startTime,
    endTime: template.endTime,
  }));

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-6 py-12 text-[var(--color-foreground)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-gray-200 bg-[var(--color-surface)] px-8 py-6 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
              Panel admin
            </div>
            <h1 className="mt-2 text-3xl font-semibold">Control operativo</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gestiona plantillas, cupos y créditos por estudiante.
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 transition hover:border-gray-400 dark:text-gray-300 dark:border-gray-700"
            >
              Salir
            </button>
          </form>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <AdminTemplatesClient templates={templateData} />

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-gray-200 bg-[var(--color-surface)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Generar cupos</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Crea cupos reales en base a plantillas existentes.
              </p>
              <form
                action={async (formData) => {
                  "use server";
                  await generateSlots({
                    startDate: String(formData.get("startDate")),
                    endDate: String(formData.get("endDate")),
                  });
                }}
                className="mt-4 flex flex-col gap-3"
              >
                <input
                  type="date"
                  name="startDate"
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
                  required
                />
                <input
                  type="date"
                  name="endDate"
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
                  required
                />
                <button
                  type="submit"
                  className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white dark:bg-white dark:text-black"
                >
                  Generar cupos
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-[var(--color-surface)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Telegram</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Verifica que las notificaciones están activas.
              </p>
              <form
                action={async () => {
                  "use server";
                  const baseUrl = ensureEnv(
                    process.env.NEXTAUTH_URL,
                    "NEXTAUTH_URL",
                  );
                  await fetch(new URL("/api/telegram/test", baseUrl), {
                    method: "POST",
                  });
                }}
                className="mt-4"
              >
                <button
                  type="submit"
                  className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300 dark:border-gray-700"
                >
                  Enviar test
                </button>
              </form>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-[var(--color-surface)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Seed local</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Crea whitelist y rol admin para desarrollo.
              </p>
              <form
                action={async () => {
                  "use server";
                  const baseUrl = ensureEnv(
                    process.env.NEXTAUTH_URL,
                    "NEXTAUTH_URL",
                  );
                  await fetch(new URL("/api/seed", baseUrl), {
                    method: "POST",
                  });
                }}
                className="mt-4"
              >
                <button
                  type="submit"
                  className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300 dark:border-gray-700"
                >
                  Ejecutar seed
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-[var(--color-surface)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Usuarios recientes</h3>
              <div className="mt-4 space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-900 dark:border-gray-800"
                  >
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user.name ?? user.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Créditos: {user.classCredits}</div>
              <form
                action={async (formData) => {
                  "use server";
                  await updateCredits({
                    userId: user.id,
                    classCredits: Number(formData.get("classCredits")),
                  });
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  name="classCredits"
                  type="number"
                  min={0}
                  defaultValue={user.classCredits}
                  className="w-24 rounded-xl border border-gray-300 bg-white px-3 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                />
                <button
                  type="submit"
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300 dark:border-gray-700"
                >
                  Guardar
                </button>
              </form>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay usuarios registrados.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-[var(--color-surface)] p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold">Cupos próximos</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Vista rápida de los cupos disponibles generados.
              </p>
            </div>
            <div className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              {upcomingSlots.length} cupos
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {upcomingSlots.map((slot) => (
              <div
                key={slot.id}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-900 dark:border-gray-800"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(slot.startTime)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {toTimeString(slot.startTime)} - {toTimeString(slot.endTime)}
                </div>
              </div>
            ))}
            {upcomingSlots.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay cupos disponibles aún.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
