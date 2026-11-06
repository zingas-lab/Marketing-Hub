// Month helpers shared by the server and the browser. Months are "YYYY-MM" strings.

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The current month in Eastern time, where the marketing team works. */
export function currentMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}

export function isMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** "2026-11" → "November 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** "2026-11" → "2026-11 November", which sorts correctly in Drive. */
export function monthFolderName(month: string): string {
  const m = Number(month.split("-")[1]);
  return `${month} ${MONTH_NAMES[m - 1]}`;
}

/**
 * Reads the Month column of the Scripts tab. Accepts "2026-11", "11/2026", "11/1/2026"
 * and "November 2026" (or "Nov 2026"), since Sheets reformats what people type.
 */
export function parseMonth(raw: string): string | null {
  const text = raw.trim();
  let m = text.match(/^(\d{4})-(\d{1,2})/);
  if (m) return normalize(+m[1], +m[2]);
  m = text.match(/^(\d{1,2})\/(?:\d{1,2}\/)?(\d{4})$/);
  if (m) return normalize(+m[2], +m[1]);
  m = text.match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
  if (m) {
    const i = MONTH_NAMES.findIndex((n) => n.toLowerCase().startsWith(m![1].toLowerCase().slice(0, 3)));
    if (i >= 0) return normalize(+m[2], i + 1);
  }
  return null;
}

function normalize(year: number, month: number): string | null {
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 60) || "script"
  );
}
