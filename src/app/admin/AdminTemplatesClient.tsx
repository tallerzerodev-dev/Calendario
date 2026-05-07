"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWeeklyTemplate, deleteWeeklyTemplate } from "@/lib/actions/admin";

type Template = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type Action =
  | { type: "add"; template: Template }
  | { type: "remove"; id: string };

const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export default function AdminTemplatesClient({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticTemplates, updateTemplates] = useOptimistic(
    templates,
    (state: Template[], action: Action) => {
      if (action.type === "add") {
        return [action.template, ...state];
      }
      return state.filter((template) => template.id !== action.id);
    },
  );

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      setError(null);

      const dayOfWeek = Number(formData.get("dayOfWeek"));
      const startTime = String(formData.get("startTime") ?? "");
      const endTime = String(formData.get("endTime") ?? "");

      const optimistic = {
        id: `temp-${Date.now()}`,
        dayOfWeek,
        startTime,
        endTime,
      };

      updateTemplates({ type: "add", template: optimistic });

      try {
        await createWeeklyTemplate({ dayOfWeek, startTime, endTime });
      } catch {
        setError("No se pudo crear la plantilla.");
      } finally {
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      setError(null);
      updateTemplates({ type: "remove", id });
      try {
        await deleteWeeklyTemplate(id);
      } catch {
        setError("No se pudo eliminar la plantilla.");
      } finally {
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">Plantillas semanales</h2>
      <p className="mt-1 text-sm text-gray-600">
        Define bloques horarios base para generación masiva de cupos.
      </p>

      <form
        action={handleCreate}
        className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3"
      >
        <select
          name="dayOfWeek"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          defaultValue="1"
        >
          <option value="1">Lunes</option>
          <option value="2">Martes</option>
          <option value="3">Miércoles</option>
          <option value="4">Jueves</option>
          <option value="5">Viernes</option>
          <option value="6">Sábado</option>
          <option value="0">Domingo</option>
        </select>
        <input
          type="time"
          name="startTime"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          required
        />
        <input
          type="time"
          name="endTime"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="sm:col-span-3 rounded-full bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-700"
        >
          Agregar plantilla
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2 text-xs text-gray-700">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {optimisticTemplates.map((template) => (
          <div
            key={template.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {dayLabels[template.dayOfWeek] ?? "Día"} · {template.startTime} - {template.endTime}
              </div>
              <div className="text-xs text-gray-500">ID: {template.id}</div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(template.id)}
              disabled={isPending}
              className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
          </div>
        ))}
        {optimisticTemplates.length === 0 && (
          <p className="text-sm text-gray-500">No hay plantillas aún.</p>
        )}
      </div>
    </div>
  );
}
