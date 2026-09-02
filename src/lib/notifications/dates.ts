export function utcDateOnly(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number): string {
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days)
  );
  return next.toISOString().slice(0, 10);
}

export function deliverableDueWindowKeys(now = new Date()): Array<{
  dueDate: string;
  windowKey: string;
}> {
  return [
    { dueDate: addUtcDays(now, 1), windowKey: "due-1d" },
    { dueDate: addUtcDays(now, 3), windowKey: "due-3d" },
  ];
}

export function contractEndingWindow(now = new Date()): {
  endDate: string;
  windowKey: string;
} {
  return { endDate: addUtcDays(now, 7), windowKey: "end-7d" };
}
