import type { Metadata } from "next";
import Link from "next/link";
import { AssetGrid } from "@/components/AssetGrid";
import { Logo } from "@/components/Logo";
import { Swatches } from "@/components/Swatches";
import { isDemo } from "@/lib/config";
import { getIndex } from "@/lib/drive";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Brand" };

const VOICE_PAIRS = [
  { good: "Cut glare in the west-facing family room without darkening it.", weak: "Deliver a seamless shading solution." },
  { good: "Make the patio usable when bugs and heat would normally send you inside.", weak: "Transform your outdoor lifestyle." },
];

export default async function BrandPage() {
  const viewer = await requireViewer();
  const index = await getIndex();
  const logoFolder = Object.values(index.folders).find((f) => f.parentId && /logo/i.test(f.name));
  const logoFiles = logoFolder ? logoFolder.assetIds.map((id) => index.assets[id]) : [];

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Brand</h1>
        <p>The quick version of the brand guide: which logo to use, the exact colors, and how Zinga&rsquo;s sounds. When in doubt, ask before you print.</p>
      </div>

      <section className="brand-section" aria-labelledby="logo-heading">
        <h2 id="logo-heading">Logo</h2>
        <p>Use the gold mark on Deep Shade whenever you can. On light backgrounds, use the dark wordmark. Leave clear space around it, and never stretch, recolor or add effects.</p>
        <div className="logo-row">
          <figure className="logo-card dark" style={{ margin: 0 }}>
            <div className="logo-stage">
              <Logo markColor="#B08D57" />
            </div>
            <figcaption>Primary: gold mark on Deep Shade</figcaption>
          </figure>
          <figure className="logo-card light" style={{ margin: 0 }}>
            <div className="logo-stage">
              <Logo markColor="#B08D57" />
            </div>
            <figcaption>On white: dark wordmark, gold mark</figcaption>
          </figure>
          <figure className="logo-card daylight" style={{ margin: 0 }}>
            <div className="logo-stage">
              <Logo />
            </div>
            <figcaption>One color: Deep Shade only</figcaption>
          </figure>
        </div>
      </section>

      {logoFiles.length > 0 && (
        <section className="brand-section" aria-labelledby="logo-files-heading">
          <h2 id="logo-files-heading">Logo files</h2>
          <p>
            PNG for screens and documents. SVG for websites. EPS or AI for printers, sign shops and embroidery.{" "}
            {logoFolder && <Link href={`/library/${logoFolder.id}`}>See the whole folder</Link>}
          </p>
          <AssetGrid assets={logoFiles} canStream={!isDemo} isAdmin={viewer.role === "admin"} />
        </section>
      )}

      <section className="brand-section" aria-labelledby="color-heading">
        <h2 id="color-heading">Colors</h2>
        <p>Click a color to copy its hex code. Use CMYK values for print and RGB or hex for screens.</p>
        <Swatches />
      </section>

      <section className="brand-section" aria-labelledby="type-heading">
        <h2 id="type-heading">Typography</h2>
        <p>Headlines are always Essonnes. Everything else is Alfabet. If you don&rsquo;t have the brand fonts installed, Georgia and Arial are acceptable substitutes for documents.</p>
        <dl className="type-specimens">
          <div className="specimen">
            <dt>
              <strong>Essonnes Display Bold</strong>
              <span>Headlines, hero text, taglines</span>
            </dt>
            <dd style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 700, lineHeight: 1.1 }}>Expertly shaded.</dd>
          </div>
          <div className="specimen">
            <dt>
              <strong>Essonnes Display Regular</strong>
              <span>Subheads and pull quotes</span>
            </dt>
            <dd style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", lineHeight: 1.2 }}>Enjoy every space, every season.</dd>
          </div>
          <div className="specimen">
            <dt>
              <strong>Alfabet</strong>
              <span>Body copy, labels, captions</span>
            </dt>
            <dd style={{ maxWidth: "60ch" }}>Better light, less glare. Shading planned around how you live, inside and out, and installed cleanly by people who do it every day.</dd>
          </div>
        </dl>
      </section>

      <section className="brand-section" aria-labelledby="voice-heading" style={{ paddingBottom: 80 }}>
        <h2 id="voice-heading">How we sound</h2>
        <p>The calm expert who understands how a home behaves. Start with what the homeowner notices, then say what changes. Recommend; don&rsquo;t just describe.</p>
        <div className="voice">
          <div>
            <h3>Write it like this</h3>
            {VOICE_PAIRS.map((p) => (
              <div key={p.good} className="pair">
                <p>{p.good}</p>
                <p>
                  <span className="visually-hidden">Not: </span>
                  {p.weak}
                </p>
              </div>
            ))}
          </div>
          <div>
            <h3>Words to use</h3>
            <ul>
              <li>Room, patio, morning light, afternoon glare, privacy, comfort, season</li>
              <li>Expertly shaded, better light, less glare, inside and out</li>
              <li>Use the patio more often, planned around how you live</li>
            </ul>
          </div>
          <div>
            <h3>Words to skip</h3>
            <ul>
              <li>Seamless, elevated, transform, luxury, white-glove, best-in-class</li>
              <li>Outdoor oasis, touch of a button, style and function</li>
              <li>Price-led or discount language</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
