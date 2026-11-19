'use strict';

// Panel layouts for Cover Studio v2. Every layout is a list of panels.
// A panel is a rectangle in fractions of the poster (x, y, w, h), plus a
// focus point (fx, fy) inside the photo it should show first, and a default
// zoom. A panel may also carry a polygon (poly) of fractional points: when
// present the panel is clipped to that shape instead of its rectangle, which
// is how the diagonal split is built.

const LAYOUTS = [
  {
    id: 'hero-left',
    name: 'Hero Left',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1, fx: 0.5, fy: 0.45, zoom: 1.05 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5, fx: 0.7, fy: 0.3, zoom: 1.3 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5, fx: 0.3, fy: 0.7, zoom: 1.3 },
    ],
  },
  {
    id: 'hero-top',
    name: 'Hero Top',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58, fx: 0.5, fy: 0.4, zoom: 1.0 },
      { x: 0, y: 0.58, w: 0.5, h: 0.42, fx: 0.25, fy: 0.65, zoom: 1.25 },
      { x: 0.5, y: 0.58, w: 0.5, h: 0.42, fx: 0.75, fy: 0.65, zoom: 1.25 },
    ],
  },
  {
    id: 'triple',
    name: 'Triple Strip',
    panels: [
      { x: 0, y: 0, w: 0.333, h: 1, fx: 0.2, fy: 0.5, zoom: 1.2 },
      { x: 0.333, y: 0, w: 0.334, h: 1, fx: 0.5, fy: 0.4, zoom: 1.2 },
      { x: 0.667, y: 0, w: 0.333, h: 1, fx: 0.8, fy: 0.55, zoom: 1.2 },
    ],
  },
  {
    id: 'quad',
    name: 'Quad Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5, fx: 0.3, fy: 0.3, zoom: 1.25 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5, fx: 0.7, fy: 0.3, zoom: 1.25 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5, fx: 0.3, fy: 0.7, zoom: 1.25 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5, fx: 0.7, fy: 0.7, zoom: 1.25 },
    ],
  },
  {
    id: 'nine',
    name: 'Nine Grid',
    panels: [
      { x: 0, y: 0, w: 0.333, h: 0.333, fx: 0.18, fy: 0.18, zoom: 1.5 },
      { x: 0.333, y: 0, w: 0.334, h: 0.333, fx: 0.5, fy: 0.16, zoom: 1.5 },
      { x: 0.667, y: 0, w: 0.333, h: 0.333, fx: 0.82, fy: 0.18, zoom: 1.5 },
      { x: 0, y: 0.333, w: 0.333, h: 0.334, fx: 0.16, fy: 0.5, zoom: 1.5 },
      { x: 0.333, y: 0.333, w: 0.334, h: 0.334, fx: 0.5, fy: 0.5, zoom: 1.35 },
      { x: 0.667, y: 0.333, w: 0.333, h: 0.334, fx: 0.84, fy: 0.5, zoom: 1.5 },
      { x: 0, y: 0.667, w: 0.333, h: 0.333, fx: 0.18, fy: 0.82, zoom: 1.5 },
      { x: 0.333, y: 0.667, w: 0.334, h: 0.333, fx: 0.5, fy: 0.84, zoom: 1.5 },
      { x: 0.667, y: 0.667, w: 0.333, h: 0.333, fx: 0.82, fy: 0.82, zoom: 1.5 },
    ],
  },
  {
    id: 'diagonal',
    name: 'Diagonal Split',
    panels: [
      { x: 0, y: 0, w: 1, h: 1, fx: 0.35, fy: 0.35, zoom: 1.1, poly: [[0, 0], [1, 0], [0, 1]] },
      { x: 0, y: 0, w: 1, h: 1, fx: 0.7, fy: 0.7, zoom: 1.15, poly: [[1, 0], [1, 1], [0, 1]] },
    ],
  },
  {
    id: 'asymmetric',
    name: 'Asymmetric Duo',
    panels: [
      { x: 0, y: 0, w: 0.66, h: 1, fx: 0.45, fy: 0.5, zoom: 1.05 },
      { x: 0.66, y: 0, w: 0.34, h: 0.333, fx: 0.8, fy: 0.2, zoom: 1.4 },
      { x: 0.66, y: 0.333, w: 0.34, h: 0.334, fx: 0.75, fy: 0.5, zoom: 1.4 },
      { x: 0.66, y: 0.667, w: 0.34, h: 0.333, fx: 0.85, fy: 0.8, zoom: 1.4 },
    ],
  },
  {
    id: 'five-frame',
    name: 'Five Frame',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.12, fx: 0.5, fy: 0.1, zoom: 1.5 },
      { x: 0, y: 0.12, w: 0.18, h: 0.76, fx: 0.1, fy: 0.5, zoom: 1.5 },
      { x: 0.82, y: 0.12, w: 0.18, h: 0.76, fx: 0.9, fy: 0.5, zoom: 1.5 },
      { x: 0, y: 0.88, w: 1, h: 0.12, fx: 0.5, fy: 0.9, zoom: 1.5 },
      { x: 0.18, y: 0.12, w: 0.64, h: 0.76, fx: 0.5, fy: 0.5, zoom: 1.0 },
    ],
  },
];

function layoutOf(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
