import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { displayName, formatDate, isPhotographic } from "@/lib/assets";
import { categories, getIndex, recentAssets } from "@/lib/drive";
import { currentMonth, monthLabel } from "@/lib/months";
import { firstName, requireViewer } from "@/lib/session";
import { getSettings } from "@/lib/settings";

function greeting() {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function HomePage() {
  const viewer = await requireViewer();
  const [index, settings] = await Promise.all([getIndex(), getSettings()]);
  const cats = categories(index);
  const orderLinks = settings.links.filter((l) => /order|shop/i.test(l.section)).slice(0, 2);
  const recent = recentAssets(index, 6);
  const month = currentMonth();
  const monthScripts = settings.scripts.filter((s) => s.month === month);
  const quickSearches = ["logo", "door hanger", "pergola", "yard sign"];

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="hero-greeting">
            {greeting()}, {firstName(viewer)}
            {viewer.location ? ` in ${viewer.location}` : ""}.
          </p>
          <h1>Everything you need to market Zinga&rsquo;s in your territory.</h1>
          <form action="/search" role="search" className="hero-search">
            <label htmlFor="hero-q" className="visually-hidden">
              Search the library
            </label>
            <input id="hero-q" name="q" type="search" placeholder="Logos, photos, print files" />
            <button type="submit">Search</button>
          </form>
          <p className="hero-hints">
            Try{" "}
            {quickSearches.map((q) => (
              <Link key={q} href={`/search?q=${encodeURIComponent(q)}`}>
                {q}
              </Link>
            ))}
          </p>
        </div>
      </section>

      <div className="wrap home-grid">
        <div>
          {orderLinks.length > 0 && (
            <section className="section" aria-labelledby="order-heading">
              <div className="section-head">
                <h2 id="order-heading">Order print and apparel</h2>
                <Link href="/shop">All links and vendors</Link>
              </div>
              <div className="order-panels">
                {orderLinks.map((link) => (
                  <div key={link.url} className="order-panel">
                    <h3>{link.title}</h3>
                    <p>{link.description}</p>
                    <a className="button" href={link.url} target="_blank" rel="noreferrer">
                      {link.buttonLabel}
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {monthScripts.length > 0 && (
            <section className="section" aria-labelledby="film-heading">
              <div className="section-head">
                <h2 id="film-heading">Film this month</h2>
                <Link href="/social">Scripts and uploads</Link>
              </div>
              <ul className="film-list">
                {monthScripts.map((s) => (
                  <li key={s.id}>
                    <Link href={`/social?month=${month}#${s.id}`}>
                      {s.title}
                      {s.length ? <span>{s.length}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="muted" style={{ marginTop: 10, fontSize: "0.9rem" }}>
                {monthScripts.length} video {monthScripts.length === 1 ? "idea" : "ideas"} for {monthLabel(month)}.
              </p>
            </section>
          )}

          <section className="section" aria-labelledby="library-heading">
            <div className="section-head">
              <h2 id="library-heading">Library</h2>
              <Link href="/library">Browse everything</Link>
            </div>
            {cats.length ? (
              <CategoryGrid index={index} folders={cats} />
            ) : (
              <p className="muted">The library is empty. Add folders to the hub folder in Google Drive and they&rsquo;ll show up here.</p>
            )}
          </section>
        </div>

        <aside>
          {settings.announcements.length > 0 && (
            <section className="aside-block" aria-labelledby="news-heading">
              <h2 id="news-heading">From the marketing team</h2>
              <ul className="news">
                {settings.announcements.slice(0, 4).map((a) => (
                  <li key={`${a.date}-${a.title}`}>
                    {a.date && !Number.isNaN(Date.parse(a.date)) ? <time dateTime={a.date}>{formatDate(`${a.date}T12:00:00`)}</time> : null}
                    <h3>{a.title}</h3>
                    <p>{a.message}</p>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noreferrer">
                        Read more
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recent.length > 0 && (
            <section className="aside-block" aria-labelledby="recent-heading">
              <h2 id="recent-heading">Recently added</h2>
              <ul className="recent">
                {recent.map((a) => (
                  <li key={a.id}>
                    <Link href={`/library/${a.folderId}?file=${a.id}`}>
                      {a.thumbnailLink ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/files/${a.id}/thumbnail?s=400`} alt="" loading="lazy" style={isPhotographic(a) ? undefined : { objectFit: "contain", padding: 4 }} />
                      ) : (
                        <span className="thumb-fallback">{a.ext.toUpperCase()}</span>
                      )}
                      <span>
                        <strong>{displayName(a.name)}</strong>
                        <span>
                          {index.folders[a.folderId]?.name}, {formatDate(a.createdTime)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
