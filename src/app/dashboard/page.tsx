import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/app/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const [user, availableSlots, bookedSlots] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.classSlot.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { startTime: "asc" },
      take: 12,
    }),
    prisma.classSlot.findMany({
      where: { status: "BOOKED", student: { email: session.user.email } },
      orderBy: { startTime: "asc" },
      take: 6,
    }),
  ]);

  const availableData = availableSlots.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
  }));
  const bookedData = bookedSlots.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-6 py-12 text-[var(--color-foreground)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-gray-200 bg-[var(--color-surface)] px-8 py-6 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
              Panel estudiante
            </div>
            <h1 className="mt-2 text-3xl font-semibold">
              Hola {user?.name ?? session.user.email}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Créditos disponibles: {user?.classCredits ?? 0}
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

        <DashboardClient
          availableSlots={availableData}
          bookedSlots={bookedData}
        />
      </div>
    </div>
  );
}
