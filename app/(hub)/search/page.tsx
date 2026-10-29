import type { Metadata } from "next";
import Link from "next/link";
import { AssetGrid } from "@/components/AssetGrid";
import { SubfolderList } from "@/components/SubfolderList";
import { KIND_FILTERS } from "@/lib/assets";
import { isDemo } from "@/lib/config";
import { folderPath, getIndex, searchIndex } from "@/lib/drive";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Search" };

type Props = { searchParams: Promise<{ q?: string; type?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const viewer = await requireViewer();
  const [{ q = "", type }, index] = await Promise.all([searchParams, getIndex()]);
  const query = q.trim().slice(0, 200);
  const kind = KIND_FILTERS.some((f) => f.kind === type) ? type : undefined;
  const { assets, folders } = searchIndex(index, query, kind);
  const withPaths = assets.slice(0, 300).map((a) => ({ ...a, path: folderPath(index, a.folderId) }));
  const href = (t?: string) => `/search?q=${encodeURIComponent(query)}${t ? `&type=${t}` : ""}`;

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>{query ? `Results for “${query}”` : "Search the library"}</h1>
        {!query && <p>Search by file name, product or folder, like &ldquo;vertical logo&rdquo; or &ldquo;awning&rdquo;.</p>}
        <form action="/search" role="search" className="hero-search" style={{ boxShadow: "inset 0 0 0 1.5px var(--line)" }}>
          <label htmlFor="search-q" className="visually-hidden">
            Search the library
          </label>
          <input id="search-q" name="q" type="search" defaultValue={query} placeholder="Logos, photos, print files" />
          {kind && <input type="hidden" name="type" value={kind} />}
          <button type="submit">Search</button>
        </form>
      </div>

      {query && (
        <>
          {!kind && <SubfolderList folders={folders} />}
          <div className="toolbar">
            <nav className="filters" aria-label="Filter by type">
              <Link className="filter" href={href()} aria-current={!kind ? "true" : undefined}>
                All
              </Link>
              {KIND_FILTERS.map((f) => (
                <Link key={f.kind} className="filter" href={href(f.kind)} aria-current={kind === f.kind ? "true" : undefined}>
                  {f.label}
                </Link>
              ))}
            </nav>
            <span className="count">
              {assets.length} {assets.length === 1 ? "file" : "files"}
              {assets.length > withPaths.length ? `, showing the first ${withPaths.length}` : ""}
            </span>
          </div>
          {withPaths.length ? (
            <AssetGrid key={`${query}-${kind}`} assets={withPaths} canStream={!isDemo} isAdmin={viewer.role === "admin"} />
          ) : (
            <div className="empty">
              <h2>No files match &ldquo;{query}&rdquo;</h2>
              <p>Try a shorter word, like &ldquo;logo&rdquo; instead of &ldquo;horizontal gold logo&rdquo;, or browse the library by folder.</p>
              <Link className="button secondary" href="/library">
                Browse the library
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
