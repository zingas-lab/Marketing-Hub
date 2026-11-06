import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { UploadPanel } from "@/components/UploadPanel";
import { config, isDemo, sheetUrl } from "@/lib/config";
import { categories, getIndex } from "@/lib/drive";
import { currentMonth, isMonth, monthFolderName, monthLabel } from "@/lib/months";
import { requireViewer } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { emailsAt, locationsOf, pickLocation } from "@/lib/social";
import type { Upload } from "@/lib/types";
import { driveFolderLink, ensureFolders, listUploads, uploadsEnabled, type UploadFolders } from "@/lib/uploads";

export const metadata: Metadata = { title: "Social media" };

type Props = { searchParams: Promise<{ month?: string; location?: string }> };

export default async function SocialPage({ searchParams }: Props) {
  const viewer = await requireViewer();
  const [params, settings, index] = await Promise.all([searchParams, getSettings(), getIndex()]);
  const admin = viewer.role === "admin";

  const thisMonth = currentMonth();
  const month = isMonth(params.month) ? params.month : thisMonth;
  const months = [...new Set([...settings.scripts.map((s) => s.month), thisMonth])].sort();
  const scripts = settings.scripts.filter((s) => s.month === month);
  const location = pickLocation(viewer, settings, params.location);
  const locations = locationsOf(settings);
  const readyToPost = categories(index).find((f) => /social/i.test(f.name));

  // Make sure this month's folders exist in Drive, then load what's been uploaded so far.
  let folders: UploadFolders | null = null;
  let uploads: Record<string, Upload[]> = {};
  let uploadProblem: string | null = null;
  if (!uploadsEnabled()) {
    uploadProblem = admin
      ? "Uploads need a Shared Drive to save into. Set HUB_UPLOADS_FOLDER_ID (README → Social media uploads)."
      : "Uploads aren't turned on yet.";
  } else if (!location) {
    uploadProblem = admin
      ? "No locations yet. Add franchisees with a Location on the Users tab of the settings sheet, and each location gets its own upload folder."
      : "Your account isn't linked to a location yet, so there's nowhere to save uploads. Ask the marketing team to add your location on the Users tab.";
  } else if (scripts.length) {
    try {
      folders = await ensureFolders(location, month, scripts, emailsAt(settings, location));
      const lists = await Promise.all(scripts.map((s) => listUploads(folders!.scriptFolderIds[s.id])));
      uploads = Object.fromEntries(scripts.map((s, i) => [s.id, lists[i]]));
    } catch (error) {
      console.error("Social uploads unavailable:", error);
      uploadProblem = `Google Drive isn't responding for uploads right now. Try again in a few minutes.${
        admin && error instanceof Error ? ` (${error.message.slice(0, 200)})` : ""
      }`;
    }
  }

  const monthHref = (m: string) => `/social?month=${m}${admin && location ? `&location=${encodeURIComponent(location)}` : ""}`;
  const folderLink = folders ? driveFolderLink(folders.monthFolderId) : null;

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Social media</h1>
        <p>
          Each month the marketing team posts video ideas: what to say, and how to film it. Shoot them on your phone and upload your clips under each
          script.
          {readyToPost ? (
            <>
              {" "}
              Ready-to-post graphics are in <Link href={`/library/${readyToPost.id}`}>the library</Link>.
            </>
          ) : null}
        </p>
      </div>

      <div className="toolbar social-toolbar">
        <nav className="filters" aria-label="Month">
          {months.map((m) => (
            <Link key={m} href={monthHref(m)} className="filter" aria-current={m === month ? "true" : undefined}>
              {monthLabel(m)}
            </Link>
          ))}
        </nav>
        {admin && locations.length > 0 && (
          <form action="/social" className="location-picker">
            <input type="hidden" name="month" value={month} />
            <label htmlFor="location">Location</label>
            <select id="location" name="location" defaultValue={location ?? ""}>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <button type="submit" className="button secondary">
              Show
            </button>
          </form>
        )}
      </div>

      {location && folders && (
        <p className="folder-line">
          Uploads save to Google Drive in <strong>{location}</strong> / <strong>{monthFolderName(month)}</strong>
          {folderLink ? (
            <>
              {" "}
              <a href={folderLink} target="_blank" rel="noreferrer">
                Open the folder
              </a>
            </>
          ) : null}
          {!admin && !isDemo && config.shareUploadFolders ? ". It's also under Shared with me in your Google Drive." : "."}
        </p>
      )}

      {scripts.length === 0 ? (
        <div className="empty">
          <h2>No scripts for {monthLabel(month)} yet</h2>
          <p>
            {admin ? (
              <>
                Add rows to the Scripts tab of the{" "}
                {config.settingsSheetId ? <a href={sheetUrl(config.settingsSheetId)}>settings sheet</a> : "settings sheet"} with {month} in the Month
                column. They show up here within a few minutes.
              </>
            ) : (
              "The marketing team posts new video ideas at the start of each month."
            )}
          </p>
        </div>
      ) : (
        <div className="scripts">
          {scripts.map((script) => (
            <section key={script.id} id={script.id} className="script" aria-labelledby={`${script.id}-title`}>
              <div className="script-copy">
                <h2 id={`${script.id}-title`}>{script.title}</h2>
                {script.length ? <p className="script-length">{script.length}</p> : null}
                <div className="script-text">
                  {script.script.split(/\n+/).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                <div className="script-actions">
                  <CopyButton text={script.script} label="Copy script" />
                  {script.exampleUrl ? (
                    <a className="button secondary" href={script.exampleUrl} target="_blank" rel="noreferrer">
                      Watch an example
                    </a>
                  ) : null}
                </div>
                {script.notes.length > 0 && (
                  <>
                    <h3>How to film it</h3>
                    <ul className="shot-list">
                      {script.notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {folders && location ? (
                <UploadPanel
                  key={`${location}-${month}-${script.id}`}
                  month={month}
                  scriptId={script.id}
                  scriptTitle={script.title}
                  location={location}
                  initialFiles={uploads[script.id] ?? []}
                />
              ) : (
                <div className="upload-panel upload-off">
                  <h3>Your clips</h3>
                  <p className="muted">{uploadProblem}</p>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
