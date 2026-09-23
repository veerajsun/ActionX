interface ActionXLogoProps {
  className?: string;
  /** Show the wordmark next to the glyph. Defaults to true. */
  withWordmark?: boolean;
}

/**
 * Reusable ActionX logo, recreated as an SVG React component from the
 * Stitch export at actionx_logo/code.html. Keep the glyph geometry and
 * colors as-is; only `className` should control sizing.
 */
export function ActionXLogo({ className, withWordmark = true }: ActionXLogoProps) {
  return (
    <svg
      viewBox={withWordmark ? "0 0 120 36" : "0 0 32 36"}
      fill="none"
      role="img"
      aria-label="ActionX"
      className={className}
    >
      <rect x="2" y="4" width="28" height="28" rx="8" fill="#4F46E5" />
      <path
        d="M10 11L18 25M18 11L10 25"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 18L24 14M20 18L24 22"
        stroke="#A5B4FC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {withWordmark && (
        <text
          x="36"
          y="24"
          fontFamily="var(--font-geist), system-ui, sans-serif"
          fontWeight={800}
          fontSize={20}
          fill="#FFFFFF"
          letterSpacing="-0.5"
        >
          Action
          <tspan fill="#6366F1">X</tspan>
        </text>
      )}
    </svg>
  );
}
