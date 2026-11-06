import { parseMonth, slugify } from "./months";
import type { Script } from "./types";

/** Turns rows from the Scripts tab (Month | Title | Script | Filming notes | Length | Example link) into scripts. */
export function parseScripts(rows: string[][]): Script[] {
  const seen = new Set<string>();
  const scripts: Script[] = [];
  for (const [rawMonth = "", title = "", script = "", notes = "", length = "", exampleUrl = ""] of rows) {
    const month = parseMonth(rawMonth);
    if (!month || !title) continue;
    // The id names the script's upload folder, so it must stay unique within the month.
    let id = slugify(title);
    for (let n = 2; seen.has(`${month}/${id}`); n++) id = `${slugify(title)}-${n}`;
    seen.add(`${month}/${id}`);
    scripts.push({
      id,
      month,
      title,
      script,
      notes: notes
        .split(/\n+/)
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean),
      length,
      exampleUrl: /^https?:\/\//.test(exampleUrl) ? exampleUrl : undefined,
    });
  }
  return scripts;
}
