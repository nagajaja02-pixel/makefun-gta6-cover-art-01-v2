'use strict';

// Colour grades for Cover Studio v2. Every grade is a gradient map: the
// luminance of each input pixel picks a colour from the grade's stops, then
// saturation, contrast and lift shape the result. The same grade is applied
// to every panel, so a cover reads as one coherent poster.

const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset Blaze',
    stops: [[0, [10, 6, 26]], [0.22, [96, 26, 64]], [0.48, [224, 84, 36]], [0.72, [255, 168, 72]], [1, [255, 238, 196]]],
    sat: 1.18, contrast: 1.10, lift: 0,
  },
  {
    id: 'neon',
    name: 'Neon Vice',
    stops: [[0, [8, 4, 32]], [0.25, [64, 10, 96]], [0.5, [214, 32, 140]], [0.75, [255, 110, 190]], [1, [140, 240, 255]]],
    sat: 1.35, contrast: 1.12, lift: 0,
  },
  {
    id: 'gold',
    name: 'Gold Rush',
    stops: [[0, [24, 16, 4]], [0.3, [110, 70, 10]], [0.55, [212, 150, 40]], [0.8, [255, 205, 110]], [1, [255, 246, 214]]],
    sat: 1.12, contrast: 1.06, lift: 0,
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    stops: [[0, [2, 6, 22]], [0.3, [12, 34, 84]], [0.55, [30, 86, 160]], [0.8, [90, 160, 230]], [1, [200, 230, 255]]],
    sat: 1.15, contrast: 1.08, lift: 0,
  },
  {
    id: 'pastel',
    name: 'Vice Pastel',
    stops: [[0, [40, 30, 64]], [0.3, [140, 90, 150]], [0.55, [240, 150, 180]], [0.8, [255, 205, 170]], [1, [255, 244, 224]]],
    sat: 1.05, contrast: 0.98, lift: 6,
  },
  {
    id: 'ink',
    name: 'Mono Ink',
    stops: [[0, [0, 0, 0]], [0.35, [40, 38, 44]], [0.65, [150, 148, 156]], [1, [255, 255, 252]]],
    sat: 0, contrast: 1.22, lift: 0,
  },
  {
    id: 'coral',
    name: 'Coral Heat',
    stops: [[0, [28, 6, 18]], [0.28, [120, 30, 50]], [0.55, [240, 90, 70]], [0.8, [255, 160, 110]], [1, [255, 230, 190]]],
    sat: 1.25, contrast: 1.10, lift: 0,
  },
  {
    id: 'emerald',
    name: 'Emerald Night',
    stops: [[0, [2, 14, 8]], [0.3, [10, 70, 46]], [0.55, [30, 150, 100]], [0.8, [90, 220, 160]], [1, [210, 255, 220]]],
    sat: 1.28, contrast: 1.12, lift: 0,
  },
];

function gradeOf(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Build a 256-entry lookup table for one grade: input luminance -> output RGB.
function buildLut(grade) {
  const lut = { r: new Uint8Array(256), g: new Uint8Array(256), b: new Uint8Array(256) };
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const span = (b[0] - a[0]) || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    let r = a[1][0] + (b[1][0] - a[1][0]) * f;
    let g = a[1][1] + (b[1][1] - a[1][1]) * f;
    let bl = a[1][2] + (b[1][2] - a[1][2]) * f;
    const lum = 0.299 * r + 0.587 * g + 0.114 * bl;
    r = lum + (r - lum) * grade.sat;
    g = lum + (g - lum) * grade.sat;
    bl = lum + (bl - lum) * grade.sat;
    r = 128 + (r - 128) * grade.contrast + grade.lift;
    g = 128 + (g - 128) * grade.contrast + grade.lift;
    bl = 128 + (bl - 128) * grade.contrast + grade.lift;
    lut.r[i] = Math.max(0, Math.min(255, Math.round(r)));
    lut.g[i] = Math.max(0, Math.min(255, Math.round(g)));
    lut.b[i] = Math.max(0, Math.min(255, Math.round(bl)));
  }
  return lut;
}

// Apply a grade's lookup table to an ImageData object, in place.
function applyLut(imageData, lut) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = lut.r[lum];
    d[i + 1] = lut.g[lum];
    d[i + 2] = lut.b[lum];
  }
}
