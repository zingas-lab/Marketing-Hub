import "server-only";
import { config, isDemo } from "./config";
import { demoSettings } from "./demo";
import { googleJson } from "./google";
import { parseScripts } from "./scripts-parse";
import type { Announcement, HubLink, HubSettings, HubUser, Script } from "./types";

// The settings sheet's tabs. Row 1 of each is a header row and is skipped.
//   Links:          Section | Title | Description | URL | Button label
//   Announcements:  Date | Title | Message | Link (optional)
//   Users:          Email | Name | Location | Role (admin or franchisee)
//   Scripts:        Month | Title | Script | Filming notes | Length | Example link (optional)
const RANGES = ["Links!A2:E", "Announcements!A2:D", "Users!A2:D"];
const SCRIPTS_RANGE = "Scripts!A2:F";

type Rows = string[][];

const clean = (rows: Rows | undefined) => (rows ?? []).map((row) => row.map((c) => (c ?? "").trim()));

/** The Scripts tab is read on its own so a sheet without one still loads everything else. */
async function loadScripts(): Promise<Script[]> {
  let rows: Rows;
  try {
    const data = await googleJson<{ values?: Rows }>(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.settingsSheetId}/values/${encodeURIComponent(SCRIPTS_RANGE)}`,
    );
    rows = clean(data.values);
  } catch (error) {
    console.warn("Couldn't read the Scripts tab of the settings sheet:", error);
    return [];
  }
  return parseScripts(rows);
}


let cached: { at: number; settings: HubSettings } | null = null;

async function load(): Promise<HubSettings> {
  const params = new URLSearchParams();
  for (const r of RANGES) params.append("ranges", r);
  const data = await googleJson<{ valueRanges: { values?: Rows }[] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.settingsSheetId}/values:batchGet?${params}`,
  );
  const [links, announcements, users] = data.valueRanges.map((r) => clean(r.values));

  return {
    links: links
      .filter((r) => r[1] && r[3])
      .map<HubLink>(([section, title, description, url, buttonLabel]) => ({
        section: section || "Links",
        title,
        description: description ?? "",
        url,
        buttonLabel: buttonLabel || `Open ${title}`,
      })),
    announcements: announcements
      .filter((r) => r[1])
      .map<Announcement>(([date, title, message, url]) => ({ date, title, message: message ?? "", url: url || undefined }))
      .sort((a, b) => Date.parse(b.date || "0") - Date.parse(a.date || "0")),
    users: users
      .filter((r) => r[0]?.includes("@"))
      .map<HubUser>(([email, name, location, role]) => ({
        email: email.toLowerCase(),
        name: name ?? "",
        location: location ?? "",
        role: role?.toLowerCase() === "admin" ? "admin" : "franchisee",
      })),
    scripts: await loadScripts(),
  };
}

export async function getSettings(): Promise<HubSettings> {
  if (isDemo) return demoSettings;
  if (!config.settingsSheetId) return { links: [], announcements: [], users: [], scripts: [] };
  if (cached && Date.now() - cached.at < config.cacheSeconds * 1000) return cached.settings;
  const settings = await load();
  cached = { at: Date.now(), settings };
  return settings;
}

/** Settings read fresh, for sign-in checks, so a newly added user can log in right away. */
export async function getUsersFresh(): Promise<HubUser[]> {
  if (isDemo || !config.settingsSheetId) return [];
  cached = null;
  return (await getSettings()).users;
}
