'use strict';

// Caption lettering styles for Cover Studio v2. Every style draws the same
// caption text, thick and high contrast, and every one is fitted to the
// poster width before it is drawn, so the caption never overflows the edges.

const FONT_FAMILY = '"CoverFont", "Arial Narrow", sans-serif';

const STYLES = [
  { id: 'gradient', name: 'Sunset Gradient' },
  { id: 'neon', name: 'Neon Glow' },
  { id: 'halftone', name: 'Halftone Pop' },
  { id: 'outline', name: 'Bold Outline' },
  { id: 'block', name: 'Block Shadow' },
  { id: 'chrome', name: 'Chrome Shine' },
];

function styleOf(id) {
  return STYLES.find((s) => s.id === id) || STYLES[0];
}

// Shrink the caption until it fits inside maxWidth, never below 24px.
function fitSize(ctx, text, maxWidth, startPx) {
  let size = startPx;
  while (size > 24) {
    ctx.font = '900 ' + size + 'px ' + FONT_FAMILY;
    if (ctx.measureText(text).width <= maxWidth) break;
    size = Math.floor(size * 0.92);
  }
  return size;
}

function paintCaption(ctx, text, sub, styleId, W, H) {
  if (!text) return;
  const maxW = W * 0.92;
  const size = fitSize(ctx, text, maxW, Math.round(W * 0.13));
  const capY = H - Math.round(H * 0.085);
  const subY = H - Math.round(H * 0.028);

  // A dark scrim behind the lettering so it reads over any photo.
  const scrim = ctx.createLinearGradient(0, H * 0.58, 0, H);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.58, W, H * 0.42);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';

  if (styleId === 'gradient') {
    const g = ctx.createLinearGradient(0, capY - size, 0, capY + size * 0.15);
    g.addColorStop(0, '#ffe14d');
    g.addColorStop(0.45, '#ff7a3d');
    g.addColorStop(1, '#ff2e88');
    ctx.lineWidth = size * 0.07;
    ctx.strokeStyle = '#160a24';
    ctx.strokeText(text, W / 2, capY);
    ctx.fillStyle = g;
    ctx.fillText(text, W / 2, capY);
  } else if (styleId === 'neon') {
    ctx.shadowColor = '#ff2bd6';
    ctx.shadowBlur = size * 0.32;
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = '#ff2bd6';
    ctx.strokeText(text, W / 2, capY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, W / 2, capY);
    ctx.fillText(text, W / 2, capY);
    ctx.shadowBlur = 0;
  } else if (styleId === 'halftone') {
    drawHalftone(ctx, text, size, W, capY);
  } else if (styleId === 'outline') {
    ctx.lineWidth = size * 0.13;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(text, W / 2, capY);
    ctx.fillStyle = '#14101e';
    ctx.fillText(text, W / 2, capY);
  } else if (styleId === 'block') {
    ctx.fillStyle = '#0b0b18';
    ctx.fillText(text, W / 2 + size * 0.045, capY + size * 0.05);
    ctx.lineWidth = size * 0.04;
    ctx.strokeStyle = '#0b0b18';
    ctx.strokeText(text, W / 2, capY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, W / 2, capY);
  } else if (styleId === 'chrome') {
    const g = ctx.createLinearGradient(0, capY - size, 0, capY);
    g.addColorStop(0, '#f4f6ff');
    g.addColorStop(0.45, '#9aa4c0');
    g.addColorStop(0.55, '#ffffff');
    g.addColorStop(1, '#4a5470');
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = '#101018';
    ctx.strokeText(text, W / 2, capY);
    ctx.fillStyle = g;
    ctx.fillText(text, W / 2, capY);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, size * 0.012);
    ctx.beginPath();
    ctx.moveTo(W / 2 - ctx.measureText(text).width / 2, capY - size * 0.62);
    ctx.lineTo(W / 2 + ctx.measureText(text).width / 2, capY - size * 0.62);
    ctx.stroke();
  }

  if (sub) paintSubtitle(ctx, sub, W, subY, size);
}

// Halftone: render the text solid to an offscreen canvas, then redraw it as
// a field of dots wherever the text is opaque.
function drawHalftone(ctx, text, size, W, capY) {
  const off = document.createElement('canvas');
  off.width = W;
  off.height = Math.ceil(size * 1.6);
  const o = off.getContext('2d');
  o.font = '900 ' + size + 'px ' + FONT_FAMILY;
  o.textAlign = 'center';
  o.textBaseline = 'middle';
  o.fillStyle = '#ffffff';
  o.fillText(text, W / 2, off.height / 2);
  const data = o.getImageData(0, 0, off.width, off.height).data;
  const step = Math.max(6, Math.round(size * 0.06));
  const top = capY - size;
  ctx.fillStyle = '#ffd23f';
  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      const a = data[(y * off.width + x) * 4 + 3];
      if (a > 110) {
        const r = step * 0.42 * (0.7 + 0.3 * (a / 255));
        ctx.beginPath();
        ctx.arc(x, top + y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = Math.max(2, size * 0.02);
  ctx.beginPath();
  ctx.arc(0, 0, 0, 0, 0);
}

// Subtitle: uppercase, hand letter-spaced, small and bright.
function paintSubtitle(ctx, sub, W, y, capSize) {
  const text = sub.toUpperCase();
  const size = Math.max(18, Math.round(capSize * 0.26));
  ctx.font = '700 ' + size + 'px ' + FONT_FAMILY;
  const gap = size * 0.28;
  const widths = [];
  let total = 0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    widths.push(w);
    total += w + gap;
  }
  total -= gap;
  let x = (W - total) / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 6;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, y);
    x += widths[i] + gap;
  }
  ctx.shadowBlur = 0;
}
