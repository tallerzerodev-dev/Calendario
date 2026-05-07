export function toTimeString(date: Date) {
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function ensureEnv(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`Missing env var: ${label}`);
  }
  return value;
}
