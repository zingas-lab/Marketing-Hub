import Link from "next/link";
import { coverFor } from "@/lib/drive";
import type { Folder, HubIndex } from "@/lib/types";

export function CategoryGrid({ index, folders }: { index: HubIndex; folders: Folder[] }) {
  return (
    <div className="categories">
      {folders.map((folder) => {
        const cover = coverFor(index, folder.id);
        return (
          <Link key={folder.id} href={`/library/${folder.id}`} className="category">
            <div className="category-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {cover ? <img src={`/api/files/${cover.id}/thumbnail?s=800`} alt="" loading="lazy" /> : null}
            </div>
            <h3>{folder.name}</h3>
            <p>
              {folder.totalAssets} {folder.totalAssets === 1 ? "file" : "files"}
              {folder.folderIds.length ? `, ${folder.folderIds.length} ${folder.folderIds.length === 1 ? "folder" : "folders"}` : ""}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
