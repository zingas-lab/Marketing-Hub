import Link from "next/link";
import type { Folder } from "@/lib/types";

export function SubfolderList({ folders }: { folders: Folder[] }) {
  if (!folders.length) return null;
  return (
    <nav className="subfolders" aria-label="Folders">
      {folders.map((f) => (
        <Link key={f.id} href={`/library/${f.id}`} className="subfolder">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path fill="currentColor" d="M2 4.5A1.5 1.5 0 0 1 3.5 3h4.38l1.5 2H16.5A1.5 1.5 0 0 1 18 6.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15.5v-11Z" />
          </svg>
          {f.name}
          <span>{f.totalAssets}</span>
        </Link>
      ))}
    </nav>
  );
}
