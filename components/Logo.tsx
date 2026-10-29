import { LOGO_MARK, LOGO_VIEWBOX, LOGO_WORDMARK, type LogoShape } from "@/lib/logo";

function Shape({ shape }: { shape: LogoShape }) {
  return shape.tag === "polygon" ? <polygon points={shape.points} /> : <path d={shape.d} />;
}

/** The Z mark takes `markColor`; the wordmark and tagline use the current text color. */
export function Logo({ markColor = "currentColor", title = "Zinga's", className }: { markColor?: string; title?: string; className?: string }) {
  return (
    <svg className={className} viewBox={LOGO_VIEWBOX} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <g fill={markColor}>
        {LOGO_MARK.map((s, i) => (
          <Shape key={i} shape={s} />
        ))}
      </g>
      <g fill="currentColor">
        {LOGO_WORDMARK.map((s, i) => (
          <Shape key={i} shape={s} />
        ))}
      </g>
    </svg>
  );
}
