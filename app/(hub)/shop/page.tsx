import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Order & shop" };

export default async function ShopPage() {
  await requireViewer();
  const { links } = await getSettings();
  const sections = [...new Set(links.map((l) => l.section))];

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Order &amp; shop</h1>
        <p>Where to order print, buy apparel, and reach approved vendors. Every link opens in a new tab.</p>
      </div>
      {sections.length === 0 && (
        <div className="empty">
          <h2>No links yet</h2>
          <p>Add rows to the Links tab of the hub settings sheet and they&rsquo;ll show up here.</p>
        </div>
      )}
      {sections.map((section) => (
        <section key={section} className="link-section" aria-label={section}>
          <h2>{section}</h2>
          {links
            .filter((l) => l.section === section)
            .map((link) => (
              <div key={`${link.title}-${link.url}`} className="link-row">
                <div>
                  <h3>{link.title}</h3>
                  {link.description ? <p>{link.description}</p> : null}
                </div>
                <a className="button secondary" href={link.url} target="_blank" rel="noreferrer">
                  {link.buttonLabel}
                </a>
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
