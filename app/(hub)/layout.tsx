import { Header } from "@/components/Header";
import { config, driveFolderUrl, isDemo, sheetUrl } from "@/lib/config";
import { requireViewer } from "@/lib/session";

// Every page depends on who is signed in and on live Drive data.
export const dynamic = "force-dynamic";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const admin = viewer.role === "admin";

  return (
    <>
      {isDemo && (
        <div className="demo-banner">
          <div className="wrap">You&rsquo;re looking at sample content. Connect Google Drive to show your real files (see README).</div>
        </div>
      )}
      <Header viewer={viewer} />
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <p>
            {config.supportEmail ? (
              <>
                Questions or missing something? Email <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>.
              </>
            ) : (
              "Zinga's franchise marketing hub"
            )}
          </p>
          {admin && !isDemo && (
            <nav aria-label="Admin">
              {config.rootFolderId && <a href={driveFolderUrl(config.rootFolderId)}>Open the hub folder in Drive</a>}
              {config.settingsSheetId && <a href={sheetUrl(config.settingsSheetId)}>Edit links, announcements and users</a>}
            </nav>
          )}
        </div>
      </footer>
    </>
  );
}
