// Local-time date helpers. Deliberately avoid Date#toISOString() (UTC-based)
// which shifts the date by a day in timezones behind UTC.

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, delta: number): string {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + delta);
  return toIsoDate(date);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}
