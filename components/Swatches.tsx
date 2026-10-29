"use client";

import { useState } from "react";
import { BRAND_COLORS } from "@/lib/brand";

export function Swatches() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1800);
  };
  return (
    <div className="swatches">
      {BRAND_COLORS.map((c) => (
        <button key={c.hex} type="button" className="swatch" onClick={() => copy(c.hex)} aria-label={`${c.name}, ${c.hex}. Copy hex code.`}>
          <div className="swatch-chip" style={{ background: c.hex }} />
          <strong>{c.name}</strong>
          <span>{copied === c.hex ? <em>Copied {c.hex}</em> : c.hex}</span>
          <span>RGB {c.rgb}</span>
          <span>CMYK {c.cmyk}</span>
        </button>
      ))}
    </div>
  );
}
