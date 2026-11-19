'use strict';

// Cover Studio v2 — the app itself. Plain static JavaScript, no network:
// the photo is read locally, graded on a canvas, arranged into panels,
// lettered, and exported as a PNG. Everything runs in the browser.

const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  landscape: [1920, 1080],
};

const PRESETS = [
  { id: 'sunset-chase', name: 'Sunset Chase', layout: 'hero-left', grade: 'sunset', style: 'gradient' },
  { id: 'vice-nights', name: 'Vice Nights', layout: 'nine', grade: 'neon', style: 'neon' },
  { id: 'gold-rush', name: 'Gold Rush', layout: 'diagonal', grade: 'gold', style: 'block' },
  { id: 'midnight-run', name: 'Midnight Run', layout: 'asymmetric', grade: 'midnight', style: 'outline' },
  { id: 'pastel-coast', name: 'Pastel Coast', layout: 'quad', grade: 'pastel', style: 'halftone' },
];

const DEFAULTS = {
  layoutId: 'hero-left',
  gradeId: 'sunset',
  styleId: 'gradient',
  caption: 'PORT SOLENNE',
  subtitle: 'VICE NEVER SLEEPS',
  size: 'square',
};

const state = {
  photo: null,
  photoName: '',
  layoutId: DEFAULTS.layoutId,
  gradeId: DEFAULTS.gradeId,
  styleId: DEFAULTS.styleId,
  caption: DEFAULTS.caption,
  subtitle: DEFAULTS.subtitle,
  size: DEFAULTS.size,
  pans: {},
};

let gradedCache = { key: null, canvas: null };

const $ = (id) => document.getElementById(id);
const preview = $('preview');

function panKey(layoutId, i) {
  return layoutId + ':' + i;
}

function panFor(layoutId, i) {
  const key = panKey(layoutId, i);
  if (!state.pans[key]) {
    const panel = layoutOf(layoutId).panels[i];
    state.pans[key] = { dx: 0, dy: 0, zoom: panel.zoom };
  }
  return state.pans[key];
}

// The graded photo, cached per grade: the photo drawn once at up to 1400px
// on its long side, with the current grade's lookup table applied.
function gradedPhoto() {
  if (!state.photo) return null;
  const key = state.gradeId + '|' + state.photoName;
  if (gradedCache.key === key) return gradedCache.canvas;
  const img = state.photo;
  const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  applyLut(data, buildLut(gradeOf(state.gradeId)));
  ctx.putImageData(data, 0, 0);
  gradedCache = { key, canvas: c };
  return c;
}

// Where one panel's photo lands on the poster, with cover-fit, focus and pan.
function panelDraw(panel, px, py, pw, ph, pan) {
  const graded = gradedPhoto();
  const gw = graded.width;
  const gh = graded.height;
  const scale = Math.max(pw / gw, ph / gh) * pan.zoom;
  const dw = gw * scale;
  const dh = gh * scale;
  let dx = px + pw / 2 - panel.fx * dw + pan.dx;
  let dy = py + ph / 2 - panel.fy * dh + pan.dy;
  if (dw > pw) dx = Math.min(px, Math.max(px + pw - dw, dx));
  else dx = px + (pw - dw) / 2;
  if (dh > ph) dy = Math.min(py, Math.max(py + ph - dh, dy));
  else dy = py + (ph - dh) / 2;
  return { dx, dy, dw, dh };
}

function clampPan(i) {
  const layout = layoutOf(state.layoutId);
  const panel = layout.panels[i];
  const pan = panFor(state.layoutId, i);
  const W = preview.width;
  const H = preview.height;
  const px = panel.x * W;
  const py = panel.y * H;
  const pw = panel.w * W;
  const ph = panel.h * H;
  const d = panelDraw(panel, px, py, pw, ph, pan);
  const wantDx = px + pw / 2 - panel.fx * d.dw + pan.dx;
  const wantDy = py + ph / 2 - panel.fy * d.dh + pan.dy;
  if (wantDx !== d.dx) pan.dx += d.dx - wantDx;
  if (wantDy !== d.dy) pan.dy += d.dy - wantDy;
}

function renderCover(canvas) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);
  const layout = layoutOf(state.layoutId);
  const gap = Math.max(3, Math.round(W * 0.004));
  const graded = gradedPhoto();
  if (graded) {
    layout.panels.forEach((panel, i) => {
      const pan = panFor(state.layoutId, i);
      const px = panel.x * W + gap / 2;
      const py = panel.y * H + gap / 2;
      const pw = panel.w * W - gap;
      const ph = panel.h * H - gap;
      const d = panelDraw(panel, px, py, pw, ph, pan);
      ctx.save();
      ctx.beginPath();
      if (panel.poly) {
        panel.poly.forEach((pt, k) => {
          const x = px + pt[0] * pw;
          const y = py + pt[1] * ph;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
      } else {
        ctx.rect(px, py, pw, ph);
      }
      ctx.clip();
      ctx.drawImage(graded, d.dx, d.dy, d.dw, d.dh);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = Math.max(2, Math.round(W * 0.002));
      ctx.beginPath();
      if (panel.poly) {
        panel.poly.forEach((pt, k) => {
          const x = px + pt[0] * pw;
          const y = py + pt[1] * ph;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
      } else {
        ctx.rect(px, py, pw, ph);
      }
      ctx.stroke();
    });
  }
  paintCaption(ctx, state.caption, state.subtitle, state.styleId, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(3, Math.round(W * 0.004));
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
}

function renderPreview() {
  const dims = SIZES[state.size];
  preview.width = dims[0];
  preview.height = dims[1];
  renderCover(preview);
}

// ---- photo loading -------------------------------------------------------

function loadImage(src, name) {
  const img = new Image();
  img.onload = () => {
    state.photo = img;
    state.photoName = name;
    gradedCache = { key: null, canvas: null };
    renderPreview();
  };
  img.src = src;
}

function loadSample(name) {
  loadImage('samples/' + name, name);
}

// ---- state changes -------------------------------------------------------

function setLayout(id) {
  state.layoutId = id;
  syncButtons();
  renderPreview();
}

function setGrade(id) {
  state.gradeId = id;
  gradedCache = { key: null, canvas: null };
  syncButtons();
  renderPreview();
}

function setStyle(id) {
  state.styleId = id;
  syncButtons();
  renderPreview();
}

function setSize(name) {
  state.size = name;
  syncButtons();
  renderPreview();
}

function setCaption(text) {
  state.caption = text;
  const input = $('captionInput');
  if (input && input.value !== text) input.value = text;
  renderPreview();
}

function setSubtitle(text) {
  state.subtitle = text;
  const input = $('subtitleInput');
  if (input && input.value !== text) input.value = text;
  renderPreview();
}

function applyPreset(p) {
  state.layoutId = p.layout;
  state.gradeId = p.grade;
  state.styleId = p.style;
  gradedCache = { key: null, canvas: null };
  syncButtons();
  renderPreview();
}

function shuffle() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layoutId = pick(LAYOUTS).id;
  state.gradeId = pick(GRADES).id;
  state.styleId = pick(STYLES).id;
  gradedCache = { key: null, canvas: null };
  syncButtons();
  renderPreview();
}

// Surprise: randomise everything at once — layout, grade, lettering, poster
// size, and every panel's zoom and focus — and, when the caption is still
// the default one, swap in a random poster tagline too.
const TAGLINES = [
  ['NEON HARBOR', 'EVERY LIGHT HAS A PRICE'],
  ['GOLDEN HOUR', 'RUN IT BACK BEFORE DARK'],
  ['MIDNIGHT TIDE', 'THE CITY NEVER BLINKS'],
  ['CORAL SKIES', 'CHASE THE LAST LIGHT'],
  ['EMERALD CITY', 'GREEN MEANS GO'],
  ['VELVET ROADS', 'DRIVE LIKE YOU MEAN IT'],
];

function surprise() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layoutId = pick(LAYOUTS).id;
  state.gradeId = pick(GRADES).id;
  state.styleId = pick(STYLES).id;
  state.size = pick(Object.keys(SIZES));
  const layout = layoutOf(state.layoutId);
  layout.panels.forEach((panel, i) => {
    const pan = panFor(state.layoutId, i);
    pan.zoom = 1 + Math.random() * 0.7;
    pan.dx = (Math.random() - 0.5) * 60;
    pan.dy = (Math.random() - 0.5) * 60;
    clampPan(i);
  });
  if (state.caption === DEFAULTS.caption) {
    const line = pick(TAGLINES);
    state.caption = line[0];
    state.subtitle = line[1];
    $('captionInput').value = line[0];
    $('subtitleInput').value = line[1];
  }
  gradedCache = { key: null, canvas: null };
  syncButtons();
  renderPreview();
}

function resetAll() {
  state.layoutId = DEFAULTS.layoutId;
  state.gradeId = DEFAULTS.gradeId;
  state.styleId = DEFAULTS.styleId;
  state.caption = DEFAULTS.caption;
  state.subtitle = DEFAULTS.subtitle;
  state.size = DEFAULTS.size;
  state.pans = {};
  $('captionInput').value = DEFAULTS.caption;
  $('subtitleInput').value = DEFAULTS.subtitle;
  gradedCache = { key: null, canvas: null };
  syncButtons();
  renderPreview();
}

// ---- export --------------------------------------------------------------

function exportDataURL(sizeName) {
  const dims = SIZES[sizeName];
  const c = document.createElement('canvas');
  c.width = dims[0];
  c.height = dims[1];
  const keepSize = state.size;
  state.size = sizeName;
  renderCover(c);
  state.size = keepSize;
  return c.toDataURL('image/png');
}

function downloadExport(sizeName) {
  const dims = SIZES[sizeName];
  const c = document.createElement('canvas');
  c.width = dims[0];
  c.height = dims[1];
  const keepSize = state.size;
  state.size = sizeName;
  renderCover(c);
  state.size = keepSize;
  c.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cover-studio-' + sizeName + '.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

// ---- UI ------------------------------------------------------------------

function buildButtons(containerId, items, currentId, onPick) {
  const box = $(containerId);
  box.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (item.id === currentId ? ' active' : '');
    b.textContent = item.name;
    b.dataset.pickId = item.id;
    b.addEventListener('click', () => onPick(item.id));
    box.appendChild(b);
  });
}

function syncButtons() {
  const mark = (containerId, currentId) => {
    const box = $(containerId);
    if (!box) return;
    box.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b.dataset.pickId === currentId);
    });
  };
  mark('layoutBtns', state.layoutId);
  mark('gradeBtns', state.gradeId);
  mark('styleBtns', state.styleId);
  mark('sizeBtns', state.size);
}

function buildUI() {
  buildButtons('layoutBtns', LAYOUTS, state.layoutId, setLayout);
  buildButtons('gradeBtns', GRADES, state.gradeId, setGrade);
  buildButtons('styleBtns', STYLES, state.styleId, setStyle);
  buildButtons('presetBtns', PRESETS, '', (id) => applyPreset(PRESETS.find((p) => p.id === id)));
  buildButtons('sizeBtns', [
    { id: 'square', name: 'Square 1080x1080' },
    { id: 'portrait', name: 'Portrait 1080x1350' },
    { id: 'landscape', name: 'Wide 1920x1080' },
  ], state.size, setSize);
  $('captionInput').value = state.caption;
  $('subtitleInput').value = state.subtitle;
  $('captionInput').addEventListener('input', (e) => setCaption(e.target.value));
  $('subtitleInput').addEventListener('input', (e) => setSubtitle(e.target.value));
  $('shuffleBtn').addEventListener('click', shuffle);
  $('surpriseBtn').addEventListener('click', surprise);
  $('resetBtn').addEventListener('click', resetAll);
  $('uploadInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result, file.name);
    reader.readAsDataURL(file);
  });
  $('sampleBoulevard').addEventListener('click', () => loadSample('boulevard.jpg'));
  $('samplePier').addEventListener('click', () => loadSample('pier.jpg'));
  $('exportSquare').addEventListener('click', () => downloadExport('square'));
  $('exportPortrait').addEventListener('click', () => downloadExport('portrait'));
  $('exportLandscape').addEventListener('click', () => downloadExport('landscape'));
}

// ---- pointer interaction: drag to pan, scroll to zoom ---------------------

let drag = null;

function panelAt(cx, cy) {
  const rect = preview.getBoundingClientRect();
  const x = (cx - rect.left) * (preview.width / rect.width);
  const y = (cy - rect.top) * (preview.height / rect.height);
  const layout = layoutOf(state.layoutId);
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (x >= p.x * preview.width && x <= (p.x + p.w) * preview.width &&
        y >= p.y * preview.height && y <= (p.y + p.h) * preview.height) {
      return { index: i, x, y };
    }
  }
  return null;
}

preview.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  drag = { index: hit.index, lastX: e.clientX, lastY: e.clientY };
  preview.setPointerCapture(e.pointerId);
});

preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = preview.getBoundingClientRect();
  const scale = preview.width / rect.width;
  const pan = panFor(state.layoutId, drag.index);
  pan.dx += (e.clientX - drag.lastX) * scale;
  pan.dy += (e.clientY - drag.lastY) * scale;
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  clampPan(drag.index);
  renderPreview();
});

preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('pointercancel', () => { drag = null; });

preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  const pan = panFor(state.layoutId, hit.index);
  pan.zoom = Math.min(3.5, Math.max(1, pan.zoom * Math.exp(-e.deltaY * 0.0012)));
  clampPan(hit.index);
  renderPreview();
}, { passive: false });

// ---- boot ----------------------------------------------------------------

buildUI();
loadSample('pier.jpg');
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => renderPreview());
}

window.CoverStudio = {
  state, GRADES, LAYOUTS, STYLES, PRESETS, SIZES,
  setLayout, setGrade, setStyle, setSize, setCaption, setSubtitle,
  loadSample, shuffle, surprise, resetAll, applyPreset, exportDataURL, renderPreview,
};
