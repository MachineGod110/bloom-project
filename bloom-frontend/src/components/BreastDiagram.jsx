import React from "react";

// A schematic (not literal) diagram: an outline shape with a nipple/areola
// landmark and a light quadrant grid, so the guide paths below have a clear
// frame of reference. Each technique gets its own dashed guide path plus a
// dot that visibly travels that exact path via native SVG <animateMotion>,
// so the motion is unambiguous rather than a vague pulsing dot.

const CX = 120;
const CY = 150;
const W = 240;
const H = 300;

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// Spiral inward from the outer edge to the nipple — mirrors the "circular"
// technique described in the copy (concentric circles, shrinking inward).
function buildSpiralPath(cx, cy, startR, endR, turns, steps) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = startR + (endR - startR) * t;
    const angle = 360 * turns * t;
    const [x, y] = polarToXY(cx, cy, r, angle);
    d += i === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)} ` : `L ${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d;
}

// Up-down overlapping strips moving left to right across the whole area.
function buildStripPath(xStart, xEnd, yTop, yBottom, columns) {
  let d = "";
  const step = (xEnd - xStart) / (columns - 1);
  for (let c = 0; c < columns; c++) {
    const x = xStart + step * c;
    const goingDown = c % 2 === 0;
    const y1 = goingDown ? yTop : yBottom;
    const y2 = goingDown ? yBottom : yTop;
    d += c === 0 ? `M ${x.toFixed(1)},${y1.toFixed(1)} ` : `L ${x.toFixed(1)},${y1.toFixed(1)} `;
    d += `L ${x.toFixed(1)},${y2.toFixed(1)} `;
  }
  return d;
}

// A "flower" of wedges radiating from the nipple, tracing every slice in turn.
function buildWedgePath(cx, cy, radius, wedges) {
  let d = `M ${cx},${cy} `;
  for (let i = 0; i <= wedges; i++) {
    const angle = (360 / wedges) * i;
    const [x, y] = polarToXY(cx, cy, radius, angle);
    d += `L ${x.toFixed(1)},${y.toFixed(1)} L ${cx},${cy} `;
  }
  return d;
}

const GUIDES = {
  circular: buildSpiralPath(CX, CY, 78, 8, 3.25, 90),
  vertical: buildStripPath(58, 182, 45, 255, 6),
  wedge: buildWedgePath(CX, CY, 82, 8),
};

const DURATIONS = { circular: "6s", vertical: "5s", wedge: "5s" };

export default function BreastDiagram({ motion }) {
  const guidePath = motion ? GUIDES[motion] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="240" height="300" role="img" aria-label="Schematic self-exam diagram">
      <defs>
        <radialGradient id="breastFill" cx="45%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fbf3f6" />
          <stop offset="100%" stopColor="#f4dce1" />
        </radialGradient>
      </defs>

      {/* Outline */}
      <path
        d="M120,26 C166,26 194,72 194,140 C194,206 162,262 120,272 C78,262 46,206 46,140 C46,72 74,26 120,26 Z"
        fill="url(#breastFill)"
        stroke="#c97888"
        strokeWidth="2"
      />

      {/* Quadrant reference grid, labeled by clock position like real exam guides */}
      <line x1="120" y1="45" x2="120" y2="258" stroke="#49283d" strokeOpacity="0.15" strokeWidth="1.5" />
      <line x1="55" y1="150" x2="185" y2="150" stroke="#49283d" strokeOpacity="0.15" strokeWidth="1.5" />
      <text x="120" y="38" textAnchor="middle" fontSize="9" fill="#49283d" opacity="0.45">12</text>
      <text x="192" y="154" textAnchor="middle" fontSize="9" fill="#49283d" opacity="0.45">3</text>
      <text x="120" y="268" textAnchor="middle" fontSize="9" fill="#49283d" opacity="0.45">6</text>
      <text x="48" y="154" textAnchor="middle" fontSize="9" fill="#49283d" opacity="0.45">9</text>

      {/* Guide path for the current technique */}
      {guidePath && (
        <path d={guidePath} fill="none" stroke="#d6a45e" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" opacity="0.75" />
      )}

      {/* Areola + nipple landmark */}
      <circle cx={CX} cy={CY} r="17" fill="#49283d" opacity="0.18" />
      <circle cx={CX} cy={CY} r="6" fill="#49283d" />

      {/* Moving fingertip indicator tracing the guide path */}
      {guidePath && (
        <circle r="7" fill="#49283d" stroke="#fff" strokeWidth="2">
          <animateMotion dur={DURATIONS[motion]} repeatCount="indefinite" path={guidePath} rotate="auto" />
        </circle>
      )}
    </svg>
  );
}
