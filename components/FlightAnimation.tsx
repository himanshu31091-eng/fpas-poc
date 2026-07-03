"use client";

/**
 * Looping, dependency-free "GIF": a plane flies an arc from the origin to
 * Amsterdam along a drawing flight path, with drifting clouds. Pure SVG/SMIL,
 * white on the brand gradient — crisp at any size, works offline.
 */
export function FlightAnimation() {
  return (
    <svg
      viewBox="0 0 480 96"
      className="w-full max-w-md"
      role="img"
      aria-label="A plane flying from origin to Amsterdam"
    >
      {/* drifting clouds */}
      <g fill="rgba(255,255,255,0.18)">
        <g>
          <ellipse cx="120" cy="26" rx="18" ry="6" />
          <ellipse cx="134" cy="23" rx="12" ry="5" />
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="40 0"
            dur="9s"
            repeatCount="indefinite"
          />
        </g>
        <g>
          <ellipse cx="330" cy="18" rx="20" ry="6" />
          <ellipse cx="316" cy="15" rx="12" ry="5" />
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="-46 0"
            dur="11s"
            repeatCount="indefinite"
          />
        </g>
      </g>

      {/* flight route (draws itself, then loops) */}
      <path
        id="fpas-route"
        d="M46 74 Q 240 -6 436 50"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 7"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="50"
          to="0"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </path>

      {/* endpoints */}
      <g>
        <circle cx="46" cy="74" r="4.5" fill="#fff" />
        <text x="46" y="90" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="monospace">
          DXB
        </text>
      </g>
      <g>
        <circle cx="436" cy="50" r="5.5" fill="#fff" />
        <circle cx="436" cy="50" r="5.5" fill="none" stroke="#fff" strokeWidth="1.5">
          <animate attributeName="r" from="5.5" to="12" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.8" to="0" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="436" y="70" textAnchor="middle" fill="#fff" fontSize="9" fontFamily="monospace">
          AMS
        </text>
      </g>

      {/* plane, following the route */}
      <g>
        <path
          d="M-9 -4 L11 0 L-9 4 L-4 0 Z"
          fill="#fff"
        />
        <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto" keyTimes="0;1" calcMode="linear">
          <mpath href="#fpas-route" />
        </animateMotion>
      </g>
    </svg>
  );
}
