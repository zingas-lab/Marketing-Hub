import "server-only";
import { isMonth } from "./months";
import { getSettings } from "./settings";
import type { HubSettings, Script, Viewer } from "./types";
import { ensureFolders } from "./uploads";

/** Every location named on the Users tab, alphabetically. */
export function locationsOf(settings: HubSettings): string[] {
  return [...new Set(settings.users.map((u) => u.location).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function emailsAt(settings: HubSettings, location: string): string[] {
  return settings.users.filter((u) => u.location === location).map((u) => u.email);
}

/**
 * Which location's uploads this person is working with. Franchisees always get their own;
 * admins can pick any location on the Users tab.
 */
export function pickLocation(viewer: Viewer, settings: HubSettings, requested?: string | null): string | null {
  if (viewer.role === "admin") {
    const locations = locationsOf(settings);
    if (requested && locations.includes(requested)) return requested;
    return viewer.location || locations[0] || null;
  }
  return viewer.location || null;
}

type Target = { ok: true; script: Script; location: string; folderId: string } | { ok: false; status: number; message: string };

/** Resolves an upload request to a script folder the person is allowed to use. */
export async function resolveTarget(viewer: Viewer, input: { month?: string | null; script?: string | null; location?: string | null }): Promise<Target> {
  const settings = await getSettings();
  const location = pickLocation(viewer, settings, input.location);
  if (!location) {
    return { ok: false, status: 403, message: "Your account isn't linked to a location yet. Ask the marketing team to add it on the Users tab." };
  }
  if (!isMonth(input.month ?? undefined)) return { ok: false, status: 400, message: "Missing or invalid month." };
  const script = settings.scripts.find((s) => s.month === input.month && s.id === input.script);
  if (!script) return { ok: false, status: 404, message: "That script isn't on this month's list anymore. Reload the page." };
  const folders = await ensureFolders(location, script.month, [script], emailsAt(settings, location));
  return { ok: true, script, location, folderId: folders.scriptFolderIds[script.id] };
}
