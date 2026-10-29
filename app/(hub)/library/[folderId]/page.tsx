import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetGrid } from "@/components/AssetGrid";
import { SubfolderList } from "@/components/SubfolderList";
import { isDemo } from "@/lib/config";
import { breadcrumbs, getIndex } from "@/lib/drive";
import { getViewer, requireViewer } from "@/lib/session";

type Params = { params: Promise<{ folderId: string }>; searchParams: Promise<{ file?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!(await getViewer())) return { title: "Library" };
  const { folderId } = await params;
  const folder = (await getIndex()).folders[folderId];
  return { title: folder?.name ?? "Library" };
}

export default async function FolderPage({ params, searchParams }: Params) {
  const viewer = await requireViewer();
  const [{ folderId }, { file }, index] = await Promise.all([params, searchParams, getIndex()]);
  const folder = index.folders[folderId];
  if (!folder || folderId === index.rootId) notFound();

  const trail = breadcrumbs(index, folderId);
  const subfolders = folder.folderIds.map((id) => index.folders[id]);
  const assets = folder.assetIds.map((id) => index.assets[id]);

  return (
    <div className="wrap">
      <div className="page-head">
        <ol className="crumbs">
          <li>
            <Link href="/library">Library</Link>
          </li>
          {trail.slice(0, -1).map((f) => (
            <li key={f.id}>
              <Link href={`/library/${f.id}`}>{f.name}</Link>
            </li>
          ))}
        </ol>
        <h1>{folder.name}</h1>
        {folder.description ? <p>{folder.description}</p> : null}
      </div>

      <SubfolderList folders={subfolders} />

      {assets.length > 0 ? (
        <AssetGrid assets={assets} filterable canStream={!isDemo} isAdmin={viewer.role === "admin"} initialFileId={file && index.assets[file]?.folderId === folderId ? file : undefined} />
      ) : subfolders.length === 0 ? (
        <div className="empty">
          <h2>Nothing here yet</h2>
          <p>Files added to this folder in Google Drive appear here within a few minutes.</p>
        </div>
      ) : (
        <div style={{ paddingBottom: 80 }} />
      )}
    </div>
  );
}
