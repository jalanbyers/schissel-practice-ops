/**
 * Telemed.ai brand mark — a hub with four spokes that resolves into a medical
 * cross. Keeps the connected-node idea of the previous mark but drops the
 * cluster, which turned to mush below ~24px.
 *
 * Chosen by rendering five candidates at 96/34/16px and comparing: a globe+cross
 * and a cross+orbit both looked good large and illegible at 16px; a plain cross
 * read as a generic first-aid glyph. This one holds its silhouette at all three
 * and says "platform" rather than "clinic".
 *
 * Deliberately *not* a shield: TeleCred (the licensure agent inside the portal)
 * owns the shield, and the parent platform should not compete with its own
 * sub-brand in the same viewport.
 */
interface BrandMarkProps {
  size?: number;
  /** Radius of the tile. Scales with `size` unless overridden. */
  radius?: number;
  className?: string;
}

export function BrandMark({ size = 34, radius, className }: BrandMarkProps) {
  const rx = radius ?? size * 0.265;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Telemed.ai"
      style={{ flex: 'none', display: 'block' }}
    >
      <defs>
        <linearGradient id="tm-tile" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3d84c9" />
          <stop offset="1" stopColor="#1d4f8a" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx={(rx / size) * 32} fill="url(#tm-tile)" />
      {/* Matches the inset highlight the old letter tile carried. */}
      <rect
        x="0.5" y="0.5" width="31" height="31" rx={(rx / size) * 32 - 0.5}
        stroke="#fff" strokeOpacity="0.16"
      />

      {/* Four spokes. Fully rounded ends (rx = half the bar width) so the gaps
          around the hub stay visible as the mark scales down. */}
      <g fill="#fff">
        <rect x="13.9" y="6.2"  width="4.2" height="7.2" rx="2.1" />
        <rect x="13.9" y="18.6" width="4.2" height="7.2" rx="2.1" />
        <rect x="6.2"  y="13.9" width="7.2" height="4.2" rx="2.1" />
        <rect x="18.6" y="13.9" width="7.2" height="4.2" rx="2.1" />
      </g>
      <circle cx="16" cy="16" r="2.3" fill="#fff" />
    </svg>
  );
}

/**
 * Wordmark. ".ai" is tinted so the name reads as a product rather than a
 * sentence — it is the one place the brand gets to be a little playful.
 */
export function BrandWordmark() {
  return (
    <>
      Telemed<span className="brand-ai">.ai</span>
    </>
  );
}
