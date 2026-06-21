// FILE: frontend/src/components/ScoreGauge.js
// ACTION: REPLACE existing file completely
// USAGE: <ScoreGauge rating={candidate.scoreRating} />
// Clean gauge — segments, tags around the wheel, needle only. No extra text/labels outside.

import React from 'react';

const RATING_NEEDLE_ANGLE = {
  blacklisted: -100,
  poor: -55,
  average: 0,
  good: 55,
  excellent:100,
};

const SEGMENTS = 15;
const CX = 170, CY = 125, R_OUTER = 110, R_INNER = 84   ;
const START_ANGLE = -180, END_ANGLE = 0;
const GAP_DEG = 2.2;

const SEGMENT_COLORS = [
  ...Array(5).fill('#f80404'),
  ...Array(2).fill('#f97316'),
  ...Array(1).fill('#fbbf24'),
  ...Array(2).fill('#3b82f6'),
  ...Array(5).fill('#10b981'),
];

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildSegmentPath(index) {
  const segAngle = (END_ANGLE - START_ANGLE) / SEGMENTS;
  const a0 = START_ANGLE + index * segAngle + GAP_DEG / 2;
  const a1 = START_ANGLE + (index + 1) * segAngle - GAP_DEG / 2;

  const p0o = polarToXY(CX, CY, R_OUTER, a0);
  const p1o = polarToXY(CX, CY, R_OUTER, a1);
  const p0i = polarToXY(CX, CY, R_INNER, a0);
  const p1i = polarToXY(CX, CY, R_INNER, a1);

  return [
    'M ' + p0i.x + ' ' + p0i.y,
    'L ' + p0o.x + ' ' + p0o.y,
    'A ' + R_OUTER + ' ' + R_OUTER + ' 0 0 1 ' + p1o.x + ' ' + p1o.y,
    'L ' + p1i.x + ' ' + p1i.y,
    'A ' + R_INNER + ' ' + R_INNER + ' 0 0 0 ' + p0i.x + ' ' + p0i.y,
    'Z',
  ].join(' ');
}

export default function ScoreGauge({ rating }) {
  const angle = rating ? RATING_NEEDLE_ANGLE[rating] : -180;

  return (
    <svg viewBox="0 0 340 165" style={{ width: 320, height: 155, display: 'block', margin: '0 auto' }}>
      {SEGMENT_COLORS.map(function (c, i) {
        return <path key={i} d={buildSegmentPath(i)} fill={c} opacity={rating ? 1 : 0.3} />;
      })}

      <text x="50" y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill="#ef4444">Blacklisted</text>
      <text x="62" y="60" textAnchor="middle" fontSize="13" fontWeight="700" fill="#f97316">Poor</text>
      <text x="164" y="8" textAnchor="middle" fontSize="13" fontWeight="700" fill="#d97706">Average</text>
      <text x="289" y="68" textAnchor="middle" fontSize="13" fontWeight="700" fill="#3b82f6">Good</text>
      <text x="290" y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill="#10b981">Excellent</text>

      <g style={{ transition: 'transform 0.5s ease' }} transform={'rotate(' + angle + ' 170 125)'}>
        <polygon points="170,45 163,125 177,125" fill="var(--text-primary)" />
        <circle cx="170" cy="125" r="8" fill="var(--text-primary)" />
      </g>
    </svg>
  );
}