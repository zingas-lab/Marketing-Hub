import { config, isDemo } from "@/lib/config";
import { currentMonth } from "@/lib/months";
import { getSettings } from "@/lib/settings";
import { emailsAt, locationsOf } from "@/lib/social";
import { ensureFolders, uploadsEnabled } from "@/lib/uploads";

export const maxDuration = 300;

/**
 * Runs daily (see vercel.json). Creates this month's folder, and a folder per script, for
 * every location on the Users tab, so they're waiting in each franchisee's Drive on the 1st.
 * Running daily also picks up scripts added mid-month and newly added people.
 */
export async function GET(request: Request) {
  if (!isDemo && (!config.cronSecret || request.headers.get("authorization") !== `Bearer ${config.cronSecret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!uploadsEnabled()) return Response.json({ skipped: "HUB_UPLOADS_FOLDER_ID is not set" });

  const settings = await getSettings();
  const month = currentMonth();
  const scripts = settings.scripts.filter((s) => s.month === month);
  const results: Record<string, string> = {};
  for (const location of locationsOf(settings)) {
    try {
      await ensureFolders(location, month, scripts, emailsAt(settings, location));
      results[location] = "ok";
    } catch (error) {
      results[location] = error instanceof Error ? error.message : String(error);
    }
  }
  return Response.json({ month, scripts: scripts.length, locations: results });
}
