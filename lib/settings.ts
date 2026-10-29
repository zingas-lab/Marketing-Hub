import "server-only";
import { config, isDemo } from "./config";
import { demoSettings } from "./demo";
import { googleJson } from "./google";
import type { Announcement, HubLink, HubSettings, HubUser } from "./types";

// The settings sheet has three tabs. Row 1 of each is a header row and is skipped.
//   Links:          Section | Title | Description | URL | Button label
//   Announcements:  Date | Title | Message | Link (optional)
//   Users:          Email | Name | Location | Role (admin or franchisee)
const RANGES = ["Links!A2:E", "Announcements!A2:D", "Users!A2:D"];

type Rows = string[][];

let cached: { at: number; settings: HubSettings } | null = null;

async function load(): Promise<HubSettings> {
  const params = new URLSearchParams();
  for (const r of RANGES) params.append("ranges", r);
  const data = await googleJson<{ valueRanges: { values?: Rows }[] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.settingsSheetId}/values:batchGet?${params}`,
  );
  const [links, announcements, users] = data.valueRanges.map((r) => (r.values ?? []).map((row) => row.map((c) => (c ?? "").trim())));

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
  };
}

export async function getSettings(): Promise<HubSettings> {
  if (isDemo) return demoSettings;
  if (!config.settingsSheetId) return { links: [], announcements: [], users: [] };
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
