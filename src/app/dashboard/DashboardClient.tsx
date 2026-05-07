"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookSlot, cancelSlot } from "@/lib/actions/booking";
import { formatDate, toTimeString } from "@/lib/utils";

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
};

type Props = {
  availableSlots: Slot[];
  bookedSlots: Slot[];
};

type Action =
  | { type: "book"; slot: Slot }
  | { type: "cancel"; slot: Slot };

export default function DashboardClient({ availableSlots, bookedSlots }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticAvailable, updateAvailable] = useOptimistic(
    availableSlots,
    (state: Slot[], action: Action) => {
      if (action.type === "book") {
        return state.filter((slot) => slot.id !== action.slot.id);
      }
      return [action.slot, ...state];
    },
  );

  const [optimisticBooked, updateBooked] = useOptimistic(
    bookedSlots,
    (state: Slot[], action: Action) => {
      if (action.type === "book") {
        return [action.slot, ...state];
      }
      return state.filter((slot) => slot.id !== action.slot.id);
    },
  );

  const handleBook = (slot: Slot) => {
    startTransition(async () => {
      setError(null);
      updateAvailable({ type: "book", slot });
      updateBooked({ type: "book", slot });

      const formData = new FormData();
      formData.set("slotId", slot.id);

      try {
        await bookSlot(formData);
      } catch {
        setError("No se pudo reservar el cupo. Intenta nuevamente.");
      } finally {
        router.refresh();
      }
    });
  };

  const handleCancel = (slot: Slot) => {
    startTransition(async () => {
      setError(null);
      updateAvailable({ type: "cancel", slot });
      updateBooked({ type: "cancel", slot });

      const formData = new FormData();
      formData.set("slotId", slot.id);

      try {
        await cancelSlot(formData);
      } catch {
        setError("No se pudo cancelar la reserva.");
      } finally {
        router.refresh();
      }
    });
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-gray-200 bg-[var(--color-surface)] p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Cupos disponibles</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Selecciona un bloque horario para reservar tu clase.
        </p>
        {error && (
          <div className="mt-4 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800">
            {error}
          </div>
        )}
        <div className="mt-6 grid gap-4">
          {optimisticAvailable.map((slot) => (
            <div
              key={slot.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-900 dark:border-gray-800"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(new Date(slot.startTime))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {toTimeString(new Date(slot.startTime))} - {toTimeString(new Date(slot.endTime))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleBook(slot)}
                disabled={isPending}
                className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-700 dark:bg-white dark:text-black"
              >
                Reservar
              </button>
            </div>
          ))}
          {optimisticAvailable.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay cupos disponibles aún. Revisa más tarde.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-[var(--color-surface)] p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Tus reservas</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Cancela con tiempo para liberar cupos.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {optimisticBooked.map((slot) => (
            <div
              key={slot.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-900 dark:border-gray-800"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(new Date(slot.startTime))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {toTimeString(new Date(slot.startTime))} - {toTimeString(new Date(slot.endTime))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCancel(slot)}
                disabled={isPending}
                className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 transition hover:border-gray-400 disabled:cursor-not-allowed dark:text-gray-300 dark:border-gray-700"
              >
                Cancelar
              </button>
            </div>
          ))}
          {optimisticBooked.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aún no tienes reservas activas.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
