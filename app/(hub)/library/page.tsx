import type { Metadata } from "next";
import { CategoryGrid } from "@/components/CategoryGrid";
import { categories, getIndex } from "@/lib/drive";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  await requireViewer();
  const index = await getIndex();
  const root = index.folders[index.rootId];
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Library</h1>
        <p>
          {root.description ||
            "Every approved logo, photo, video and print file. Everything here is cleared for use in your territory."}
        </p>
      </div>
      <div style={{ paddingBottom: 80 }}>
        <CategoryGrid index={index} folders={categories(index)} />
      </div>
    </div>
  );
}
