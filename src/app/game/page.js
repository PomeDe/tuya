"use client";

import { useRef, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const W = 800; // internal drawing resolution (CSS scales it to fit)
const H = 500;
const THUMB_W = 80;
const THUMB_H = 50;
const MAX_HISTORY = 30;
const MAX_LAYERS = 5;
const MAX_FRAMES = 36;

const TOOLS = [
  { id: "brush", label: "Brush", icon:"https://cdn-icons-png.flaticon.com/256/587/587377.png" },
  { id: "eraser", label: "Eraser", icon:"https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/text-formatting/eraser-v11ldewzcngt3o1f0hg77.png/eraser-cwmmjrd3acra7vdluyl68a.png?_a=DATAiZAAZAA0" },
  { id: "bucket", label: "Bucket fill", icon:"https://icons.iconarchive.com/icons/icons8/windows-8/256/Diy-Paint-Bucket-icon.png" },
  { id: "picker", label: "Pick color", icon:"https://www.svgrepo.com/show/389754/color-picker-dropper-colour.svg" },
  { id: "line", label: "Line", icon:"https://www.freeiconspng.com/uploads/line-png-24.png" },
  { id: "rect", label: "Rectangle", icon:"https://static.thenounproject.com/png/177544-200.png" },
  { id: "ellipse", label: "Ellipse", icon:"https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-shadow-circle-neumorphic-circle-png-image_9231308.png" },
];
const SHAPE_TOOLS = ["line", "rect", "ellipse"];

const SWATCHES = [
  "#111111", "#6b7280", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#92400e",
];

const btn =
  "rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40";
const btnPrimary =
  "rounded-md border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40";

// ---------------------------------------------------------------------------
// Data model
//
//   layers: bottom -> top. Every layer is a "track" shared by all frames.
//     layer.cells maps a frame id to that frame's drawing on this layer.
//     A static layer (layer.shared) has ONE drawing under the key "*" that
//     appears on every frame, which is ideal for backgrounds.
//   frames: an ordered list of frame ids.
//
// A blank cell simply doesn't exist, so empty frames cost no memory.
// ---------------------------------------------------------------------------
const uid = () => Math.random().toString(36).slice(2, 9);

const makeCanvas = () => {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return c;
};

const makeLayer = (name, shared = false) => ({
  id: uid(),
  name,
  visible: true,
  opacity: 1,
  shared,
  cells: new Map(),
});

const cellKey = (layer, frameId) => (layer.shared ? "*" : frameId);
const getCell = (layer, frameId) => layer.cells.get(cellKey(layer, frameId));

function ensureCell(layer, frameId) {
  const key = cellKey(layer, frameId);
  let cell = layer.cells.get(key);
  if (!cell) {
    // version counts pixel changes; snap/saved cache undo and save data
    cell = { canvas: makeCanvas(), version: 0, snap: null, saved: null };
    layer.cells.set(key, cell);
  }
  return cell;
}

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (r, g, b) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

// Draws one frame. onionId = the frame to show faintly underneath (or null).
function paintFrame(ctx, layers, frameId, onionId = null) {
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  for (const l of layers) {
    if (!l.visible) continue;
    if (onionId && !l.shared) {
      const prev = getCell(l, onionId);
      if (prev) {
        ctx.globalAlpha = l.opacity * 0.25;
        ctx.drawImage(prev.canvas, 0, 0);
      }
    }
    const cell = getCell(l, frameId);
    if (cell) {
      ctx.globalAlpha = l.opacity;
      ctx.drawImage(cell.canvas, 0, 0);
    }
  }
  ctx.globalAlpha = 1;
}

function applyStyle(ctx, { color, size, erase }) {
  ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawShape(ctx, tool, a, b, filled, constrain) {
  let bx = b.x;
  let by = b.y;
  const dx = bx - a.x;
  const dy = by - a.y;

  if (constrain) {
    if (tool === "line") {
      const step = Math.PI / 4; // snap to 45 degree angles
      const angle = Math.round(Math.atan2(dy, dx) / step) * step;
      const len = Math.hypot(dx, dy);
      bx = a.x + Math.cos(angle) * len;
      by = a.y + Math.sin(angle) * len;
    } else {
      const s = Math.max(Math.abs(dx), Math.abs(dy)); // square / circle
      bx = a.x + Math.sign(dx || 1) * s;
      by = a.y + Math.sign(dy || 1) * s;
    }
  }

  ctx.beginPath();
  if (tool === "line") {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(bx, by);
    ctx.stroke();
  } else if (tool === "rect") {
    ctx.rect(Math.min(a.x, bx), Math.min(a.y, by), Math.abs(bx - a.x), Math.abs(by - a.y));
    if (filled) ctx.fill();
    else ctx.stroke();
  } else {
    ctx.ellipse((a.x + bx) / 2, (a.y + by) / 2, Math.abs(bx - a.x) / 2, Math.abs(by - a.y) / 2, 0, 0, Math.PI * 2);
    if (filled) ctx.fill();
    else ctx.stroke();
  }
}

// --- IndexedDB (keeps the animation so you can come back to it later) -------
const DB_NAME = "canvas-paint";
const STORE = "docs";
const KEY = "animation-v1";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Small preview of one frame for the timeline
function Thumb({ frameId, layersRef, rev }) {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    ctx.save();
    ctx.scale(THUMB_W / W, THUMB_H / H);
    paintFrame(ctx, layersRef.current, frameId);
    ctx.restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameId, rev]);
  return <canvas ref={ref} width={THUMB_W} height={THUMB_H} className="block" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DrawingApp() {
  // Mutable drawing state lives in refs so strokes don't re-render React.
  const displayRef = useRef(null);
  const layersRef = useRef([]); // index 0 = bottom layer
  const framesRef = useRef([]); // frame ids in playback order
  const frameIdxRef = useRef(0);
  const activeIdRef = useRef(null);
  const counterRef = useRef(1);
  const fpsRef = useRef(8);
  const onionRef = useRef(true);
  const playRef = useRef(null); // requestAnimationFrame id while playing
  const histRef = useRef({ stack: [], index: -1 });
  const drawingRef = useRef(null);
  const readyRef = useRef(false);
  const saveTimer = useRef(null);
  const opacityDirty = useRef(false);

  // UI state
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#111111");
  const [size, setSize] = useState(6);
  const [filled, setFilled] = useState(false);
  const [tolerance, setTolerance] = useState(100);
  const [layerList, setLayerList] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [frameList, setFrameList] = useState([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [fps, setFps] = useState(8);
  const [onion, setOnion] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rev, setRev] = useState(0); // bumps when pixels change (redraws thumbnails)
  const [hist, setHist] = useState({ canUndo: false, canRedo: false });
  const [status, setStatus] = useState("Loading…");
  const busy = playing || exporting;

  // ----- small utilities ----------------------------------------------------
  const curFrameId = () => framesRef.current[frameIdxRef.current];
  const activeLayer = () => layersRef.current.find((l) => l.id === activeIdRef.current);
  const layerCtx = (layer) => ensureCell(layer, curFrameId()).canvas.getContext("2d");
  const bump = (layer) => { ensureCell(layer, curFrameId()).version++; };

  function composite() {
    const ctx = displayRef.current?.getContext("2d");
    if (!ctx) return;
    const i = frameIdxRef.current;
    const showOnion = onionRef.current && !playRef.current && i > 0;
    paintFrame(ctx, layersRef.current, framesRef.current[i], showOnion ? framesRef.current[i - 1] : null);
  }

  function flatten() {
    const c = makeCanvas();
    paintFrame(c.getContext("2d"), layersRef.current, curFrameId());
    return c;
  }

  function syncUI() {
    setLayerList(
      layersRef.current.map(({ id, name, visible, opacity, shared }) => ({ id, name, visible, opacity, shared }))
    );
    setActiveId(activeIdRef.current);
  }

  function syncFrames() {
    setFrameList([...framesRef.current]);
    setFrameIdx(frameIdxRef.current);
  }

  function syncHist() {
    const h = histRef.current;
    setHist({ canUndo: h.index > 0, canRedo: h.index < h.stack.length - 1 });
  }

  // ----- history (undo / redo) ---------------------------------------------
  // History covers the frame you're on. Moving to another frame, or adding,
  // deleting or reordering frames, starts a fresh history.
  function takeSnapshot() {
    const fid = curFrameId();
    return {
      activeId: activeIdRef.current,
      layers: layersRef.current.map((l) => {
        const cell = getCell(l, fid);
        let img = null;
        if (cell) {
          // Reuse cached pixels if this drawing hasn't changed (saves memory)
          if (!cell.snap || cell.snap.version !== cell.version) {
            cell.snap = { version: cell.version, img: cell.canvas.getContext("2d").getImageData(0, 0, W, H) };
          }
          img = cell.snap.img;
        }
        return { ref: l, name: l.name, visible: l.visible, opacity: l.opacity, img };
      }),
    };
  }

  function restore(snap) {
    const fid = curFrameId();
    layersRef.current = snap.layers.map((s) => {
      const l = s.ref; // the layer object itself, so its other frames come back too
      l.name = s.name;
      l.visible = s.visible;
      l.opacity = s.opacity;
      if (s.img) {
        const cell = ensureCell(l, fid);
        cell.canvas.getContext("2d").putImageData(s.img, 0, 0);
        cell.version = 0;
        cell.snap = { version: 0, img: s.img };
      } else {
        l.cells.delete(cellKey(l, fid));
      }
      return l;
    });
    const stillThere = layersRef.current.some((l) => l.id === snap.activeId);
    activeIdRef.current = stillThere ? snap.activeId : layersRef.current[layersRef.current.length - 1].id;
    composite();
    syncUI();
    setRev((r) => r + 1);
  }

  function resetHistory() {
    histRef.current = { stack: [takeSnapshot()], index: 0 };
    syncHist();
  }

  function commit() {
    const h = histRef.current;
    h.stack = h.stack.slice(0, h.index + 1); // drop the redo branch
    h.stack.push(takeSnapshot());
    if (h.stack.length > MAX_HISTORY) h.stack.shift();
    h.index = h.stack.length - 1;
    syncHist();
    setRev((r) => r + 1);
    scheduleSave();
  }

  function undo() {
    const h = histRef.current;
    if (playRef.current || h.index <= 0) return;
    h.index -= 1;
    restore(h.stack[h.index]);
    syncHist();
    scheduleSave();
  }

  function redo() {
    const h = histRef.current;
    if (playRef.current || h.index >= h.stack.length - 1) return;
    h.index += 1;
    restore(h.stack[h.index]);
    syncHist();
    scheduleSave();
  }

  // ----- saving -------------------------------------------------------------
  function serialize() {
    const validKeys = new Set(["*", ...framesRef.current]);
    return {
      activeId: activeIdRef.current,
      counter: counterRef.current,
      frameIdx: frameIdxRef.current,
      fps: fpsRef.current,
      frames: framesRef.current,
      layers: layersRef.current.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        shared: l.shared,
        cells: [...l.cells]
          .filter(([key]) => validKeys.has(key))
          .map(([key, c]) => {
            // Only re-encode drawings that changed since the last save
            if (!c.saved || c.saved.version !== c.version) {
              c.saved = { version: c.version, url: c.canvas.toDataURL("image/png") };
            }
            return [key, c.saved.url];
          }),
      })),
    };
  }

  function scheduleSave() {
    clearTimeout(saveTimer.current);
    setStatus("Saving…");
    saveTimer.current = setTimeout(async () => {
      try {
        await dbSet(serialize());
        setStatus("Saved");
      } catch {
        setStatus("Couldn't save in this browser");
      }
    }, 800);
  }

  // ----- setup: load the saved animation, or start a blank one -------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let layers = null;
      let frames = null;
      let restored = false;
      try {
        const saved = await dbGet();
        if (saved?.layers?.length && saved.frames?.length) {
          layers = await Promise.all(
            saved.layers.map(async (s) => {
              const entries = await Promise.all(
                s.cells.map(async ([key, url]) => {
                  const canvas = makeCanvas();
                  canvas.getContext("2d").drawImage(await loadImage(url), 0, 0);
                  return [key, { canvas, version: 0, snap: null, saved: { version: 0, url } }];
                })
              );
              return { id: s.id, name: s.name, visible: s.visible, opacity: s.opacity, shared: s.shared, cells: new Map(entries) };
            })
          );
          frames = saved.frames;
          activeIdRef.current = saved.activeId;
          counterRef.current = saved.counter || layers.length;
          frameIdxRef.current = Math.min(saved.frameIdx || 0, frames.length - 1);
          fpsRef.current = saved.fps || 8;
          restored = true;
        }
      } catch {
        /* no saved animation, or storage unavailable */
      }
      if (cancelled) return;

      if (!layers) {
        layers = [makeLayer("Background", true), makeLayer("Layer 1")];
        activeIdRef.current = layers[1].id;
        frames = [uid()];
        frameIdxRef.current = 0;
      }
      layersRef.current = layers;
      framesRef.current = frames;
      if (!layers.some((l) => l.id === activeIdRef.current)) {
        activeIdRef.current = layers[layers.length - 1].id;
      }

      setFps(fpsRef.current);
      composite();
      syncUI();
      syncFrames();
      resetHistory();
      readyRef.current = true;
      setStatus(restored ? "Loaded your saved animation" : "Autosave is on");
    })();

    return () => {
      cancelled = true;
      clearTimeout(saveTimer.current);
      cancelAnimationFrame(playRef.current);
      playRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- keyboard shortcuts -------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- drawing ------------------------------------------------------------
  function getPos(e) {
    const r = displayRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  }

  function chooseColor(c) {
    setColor(c);
    if (tool === "eraser" || tool === "picker") setTool("brush");
  }

  function pickColor(p) {
    const x = Math.floor(p.x);
    const y = Math.floor(p.y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const [r, g, b] = flatten().getContext("2d").getImageData(x, y, 1, 1).data;
    setColor(toHex(r, g, b));
    setTool("brush");
  }

  function bucketFill(p) {
    const layer = activeLayer();
    const x = Math.floor(p.x);
    const y = Math.floor(p.y);
    if (!layer || x < 0 || y < 0 || x >= W || y >= H) return;

    // Find the region using what you can see (all visible layers)...
    const src = flatten().getContext("2d").getImageData(0, 0, W, H).data;
    const [fr, fg, fb] = hexToRgb(color);
    const start = (y * W + x) * 4;
    const tr = src[start];
    const tg = src[start + 1];
    const tb = src[start + 2];
    if (tr === fr && tg === fg && tb === fb) return; // already that color

    const near = (i) =>
      Math.abs(src[i] - tr) + Math.abs(src[i + 1] - tg) + Math.abs(src[i + 2] - tb) <= tolerance;

    // ...but paint the result onto the active layer only.
    const lctx = layerCtx(layer);
    const out = lctx.getImageData(0, 0, W, H);
    const od = out.data;
    const seen = new Uint8Array(W * H);
    const stack = [y * W + x];
    seen[stack[0]] = 1;

    while (stack.length) {
      const idx = stack.pop();
      const i = idx * 4;
      od[i] = fr;
      od[i + 1] = fg;
      od[i + 2] = fb;
      od[i + 3] = 255;

      const cx = idx % W;
      const cy = (idx - cx) / W;
      if (cx > 0 && !seen[idx - 1] && near(i - 4)) { seen[idx - 1] = 1; stack.push(idx - 1); }
      if (cx < W - 1 && !seen[idx + 1] && near(i + 4)) { seen[idx + 1] = 1; stack.push(idx + 1); }
      if (cy > 0 && !seen[idx - W] && near(i - W * 4)) { seen[idx - W] = 1; stack.push(idx - W); }
      if (cy < H - 1 && !seen[idx + W] && near(i + W * 4)) { seen[idx + W] = 1; stack.push(idx + W); }
    }

    lctx.putImageData(out, 0, 0);
    bump(layer);
    composite();
    commit();
  }

  function onDown(e) {
    if (!readyRef.current || playRef.current || !e.isPrimary) return; // ignore extra fingers
    const layer = activeLayer();
    if (!layer || !layer.visible) {
      setStatus("Show the selected layer to draw on it");
      return;
    }
    const p = getPos(e);

    if (tool === "picker") return pickColor(p);
    if (tool === "bucket") return bucketFill(p);

    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = { tool, start: p, last: p };

    if (tool === "brush" || tool === "eraser") {
      const ctx = layerCtx(layer);
      applyStyle(ctx, { color, size, erase: tool === "eraser" });
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.01, p.y); // a single click leaves a dot
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      composite();
    }
  }

  function onMove(e) {
    const d = drawingRef.current;
    if (!d) return;
    const p = getPos(e);
    const layer = activeLayer();

    if (d.tool === "brush" || d.tool === "eraser") {
      const ctx = layerCtx(layer);
      const mid = { x: (d.last.x + p.x) / 2, y: (d.last.y + p.y) / 2 };
      ctx.quadraticCurveTo(d.last.x, d.last.y, mid.x, mid.y); // smooths the line
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
      d.last = p;
      composite();
    } else {
      // Shape preview: draw on the visible canvas only, commit on release
      composite();
      const ctx = displayRef.current.getContext("2d");
      applyStyle(ctx, { color, size, erase: false });
      drawShape(ctx, d.tool, d.start, p, filled, e.shiftKey);
    }
  }

  function onUp(e) {
    const d = drawingRef.current;
    if (!d) return;
    drawingRef.current = null;
    const layer = activeLayer();
    if (!layer) return;

    if (SHAPE_TOOLS.includes(d.tool)) {
      const p = getPos(e);
      const cancelled = e.type === "pointercancel";
      if (cancelled || Math.hypot(p.x - d.start.x, p.y - d.start.y) < 2) {
        composite();
        return;
      }
      const ctx = layerCtx(layer);
      applyStyle(ctx, { color, size, erase: false });
      drawShape(ctx, d.tool, d.start, p, filled, e.shiftKey);
    }

    bump(layer);
    composite();
    commit();
  }

  // ----- layer actions ------------------------------------------------------
  function addLayer(shared) {
    if (layersRef.current.length >= MAX_LAYERS) return;
    const n = ++counterRef.current;
    const layer = makeLayer(shared ? `Static ${n}` : `Layer ${n}`, shared);
    const i = layersRef.current.findIndex((l) => l.id === activeIdRef.current);
    layersRef.current.splice(i + 1, 0, layer);
    activeIdRef.current = layer.id;
    composite();
    syncUI();
    commit();
  }

  function deleteLayer() {
    if (layersRef.current.length < 2) return;
    if (!window.confirm("Delete this layer from every frame? You can undo until you change frames.")) return;
    const i = layersRef.current.findIndex((l) => l.id === activeIdRef.current);
    layersRef.current.splice(i, 1);
    activeIdRef.current = layersRef.current[Math.max(0, i - 1)].id;
    composite();
    syncUI();
    commit();
  }

  function moveLayer(dir) {
    const arr = layersRef.current;
    const i = arr.findIndex((l) => l.id === activeIdRef.current);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    composite();
    syncUI();
    commit();
  }

  function selectLayer(id) {
    activeIdRef.current = id;
    setActiveId(id);
  }

  function toggleVisible(id) {
    const l = layersRef.current.find((x) => x.id === id);
    l.visible = !l.visible;
    composite();
    syncUI();
    commit();
  }

  function changeOpacity(id, value) {
    const l = layersRef.current.find((x) => x.id === id);
    l.opacity = value;
    opacityDirty.current = true;
    composite();
    syncUI();
  }

  function endOpacity() {
    if (!opacityDirty.current) return;
    opacityDirty.current = false;
    commit();
  }

  function clearLayer() {
    const l = activeLayer();
    const cell = l && getCell(l, curFrameId());
    if (!cell) return;
    const ctx = cell.canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    cell.version++;
    composite();
    commit();
  }

  function newAnimation() {
    if (!window.confirm("Start a new animation? The current one will be replaced and this can't be undone.")) return;
    stopPlay();
    counterRef.current = 1;
    layersRef.current = [makeLayer("Background", true), makeLayer("Layer 1")];
    activeIdRef.current = layersRef.current[1].id;
    framesRef.current = [uid()];
    frameIdxRef.current = 0;
    composite();
    syncUI();
    afterFrameChange();
  }

  // ----- frame actions ------------------------------------------------------
  function afterFrameChange() {
    composite();
    syncFrames();
    resetHistory();
    setRev((r) => r + 1);
    scheduleSave();
  }

  function gotoFrame(i) {
    if (i < 0 || i >= framesRef.current.length || i === frameIdxRef.current) return;
    frameIdxRef.current = i;
    composite();
    syncFrames();
    resetHistory();
  }

  function addFrame(copy) {
    if (framesRef.current.length >= MAX_FRAMES) return;
    const id = uid();
    const i = frameIdxRef.current;
    if (copy) {
      for (const l of layersRef.current) {
        const src = !l.shared && l.cells.get(framesRef.current[i]);
        if (!src) continue;
        const cell = ensureCell(l, id);
        cell.canvas.getContext("2d").drawImage(src.canvas, 0, 0);
        cell.version = 1;
      }
    }
    framesRef.current.splice(i + 1, 0, id);
    frameIdxRef.current = i + 1;
    afterFrameChange();
  }

  function deleteFrame() {
    if (framesRef.current.length < 2) return;
    if (!window.confirm("Delete this frame? This can't be undone.")) return;
    const i = frameIdxRef.current;
    const id = framesRef.current[i];
    for (const l of layersRef.current) l.cells.delete(id);
    framesRef.current.splice(i, 1);
    frameIdxRef.current = Math.min(i, framesRef.current.length - 1);
    afterFrameChange();
  }

  function moveFrame(dir) {
    const arr = framesRef.current;
    const i = frameIdxRef.current;
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    frameIdxRef.current = j;
    afterFrameChange();
  }

  // ----- playback -----------------------------------------------------------
  function stopPlay() {
    if (!playRef.current) return;
    cancelAnimationFrame(playRef.current);
    playRef.current = null;
    setPlaying(false);
    composite(); // brings the onion skin back
    resetHistory();
  }

  function togglePlay() {
    if (playRef.current) return stopPlay();
    if (framesRef.current.length < 2) return;
    setPlaying(true);
    let last = performance.now();
    const loop = (now) => {
      if (now - last >= 1000 / fpsRef.current) {
        last = now;
        frameIdxRef.current = (frameIdxRef.current + 1) % framesRef.current.length;
        composite();
        setFrameIdx(frameIdxRef.current);
      }
      playRef.current = requestAnimationFrame(loop);
    };
    playRef.current = requestAnimationFrame(loop);
  }

  function changeFps(v) {
    fpsRef.current = v;
    setFps(v);
    scheduleSave();
  }

  function changeOnion(v) {
    onionRef.current = v;
    setOnion(v);
    composite();
  }

  // ----- export -------------------------------------------------------------
  function download(href, name) {
    const a = document.createElement("a");
    a.download = name;
    a.href = href;
    a.click();
  }

  function exportPng() {
    download(flatten().toDataURL("image/png"), `frame-${frameIdxRef.current + 1}.png`);
  }

  async function exportVideo() {
    const mime = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find(
      (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)
    );
    if (!mime) {
      setStatus("Video export isn't supported in this browser");
      return;
    }
    setExporting(true);
    setStatus("Exporting video…");
    try {
      const out = makeCanvas();
      const octx = out.getContext("2d");
      paintFrame(octx, layersRef.current, framesRef.current[0]);
      const rec = new MediaRecorder(out.captureStream(fpsRef.current), {
        mimeType: mime,
        videoBitsPerSecond: 5_000_000,
      });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const stopped = new Promise((resolve) => { rec.onstop = resolve; });

      rec.start();
      for (const id of framesRef.current) {
        paintFrame(octx, layersRef.current, id);
        await new Promise((r) => setTimeout(r, 1000 / fpsRef.current));
      }
      rec.stop();
      await stopped;

      const url = URL.createObjectURL(new Blob(chunks, { type: mime }));
      download(url, mime.includes("mp4") ? "animation.mp4" : "animation.webm");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus("Video exported");
    } catch {
      setStatus("Video export failed");
    } finally {
      setExporting(false);
    }
  }

  // ----- UI -----------------------------------------------------------------
  const toolBtn = (t) =>
    `rounded-md border px-3 py-1.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 items-center justify-center flex ${
      tool === t
        ? "border-indigo-600 bg-indigo-600 text-white"
        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
    }`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 lg:flex-row">
      {/* Tools and colors */}
      <aside className="shrink-0 lg:w-48">
        <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-3">
              {TOOLS.map((t) => (
                <button key={t.id} onClick={() => setTool(t.id)} className={toolBtn(t.id)} aria-pressed={tool === t.id}>
              <img src={t.icon} alt={t.label} className="h-6 w-6" />
                </button>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => chooseColor(e.target.value)}
                  aria-label="Color"
                  className="h-9 w-12 cursor-pointer rounded border border-gray-300"
                />
                <span className="text-sm tabular-nums text-gray-600">{color}</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-4">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => chooseColor(c)}
                    aria-label={`Use ${c}`}
                    style={{ backgroundColor: c }}
                    className={`h-7 rounded border ${color === c ? "border-indigo-600 ring-2 ring-indigo-300" : "border-gray-300"}`}
                  />
                ))}
              </div>
            </div>

            <label className="text-sm text-gray-700">
              Size: <span className="tabular-nums">{size}px</span>
              <input
                type="range"
                min="1"
                max="60"
                value={size}
                onChange={(e) => setSize(+e.target.value)}
                className="mt-1 w-full accent-indigo-600"
              />
            </label>

            {(tool === "rect" || tool === "ellipse") && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={filled} onChange={(e) => setFilled(e.target.checked)} className="accent-indigo-600" />
                Filled shape
              </label>
            )}

            {tool === "bucket" && (
              <label className="text-sm text-gray-700">
                Fill tolerance: <span className="tabular-nums">{tolerance}</span>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={tolerance}
                  onChange={(e) => setTolerance(+e.target.value)}
                  className="mt-1 w-full accent-indigo-600"
                />
              </label>
            )}
          </div>
        </fieldset>
      </aside>

      {/* Canvas and timeline */}
      <main className="min-w-0 flex-1">
        <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button onClick={undo} disabled={!hist.canUndo} className={btn}>Undo</button>
            <button onClick={redo} disabled={!hist.canRedo} className={btn}>Redo</button>
            <button onClick={clearLayer} className={btn}>Clear layer</button>
            <button onClick={newAnimation} className={btn}>New animation</button>
            <button onClick={exportPng} className={btn}>Download frame</button>
            <button onClick={exportVideo} className={btnPrimary}>Export video</button>
            <span className="ml-auto text-sm text-gray-500" aria-live="polite">{status}</span>
          </div>
        </fieldset>

        <div className="w-full max-w-[800px]">
          <canvas
            ref={displayRef}
            width={W}
            height={H}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="block h-auto w-full cursor-crosshair touch-none rounded-lg border border-gray-300 bg-white shadow-sm"
          />
        </div>

        {/* Timeline */}
        <section className="mt-3 w-full max-w-[800px] rounded-lg border border-gray-200 bg-white p-2" aria-label="Timeline">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button onClick={togglePlay} disabled={frameList.length < 2 || exporting} className={btnPrimary}>
              {playing ? "Stop" : "Play"}
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Speed
              <input
                type="range"
                min="1"
                max="24"
                value={fps}
                disabled={exporting}
                onChange={(e) => changeFps(+e.target.value)}
                className="w-24 accent-indigo-600"
              />
              <span className="w-12 tabular-nums">{fps} fps</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={onion}
                onChange={(e) => changeOnion(e.target.checked)}
                className="accent-indigo-600"
              />
              Onion skin
            </label>
            <span className="text-sm tabular-nums text-gray-500">
              Frame {frameIdx + 1} of {frameList.length}
            </span>
          </div>

          <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <button onClick={() => addFrame(false)} disabled={frameList.length >= MAX_FRAMES} className={btn}>Add blank frame</button>
              <button onClick={() => addFrame(true)} disabled={frameList.length >= MAX_FRAMES} className={btn}>Duplicate frame</button>
              <button onClick={() => moveFrame(-1)} className={btn}>Move earlier</button>
              <button onClick={() => moveFrame(1)} className={btn}>Move later</button>
              <button onClick={deleteFrame} disabled={frameList.length < 2} className={btn}>Delete frame</button>
            </div>

            <ol className="flex gap-2 overflow-x-auto pb-1">
              {frameList.map((id, i) => (
                <li key={id} className="shrink-0">
                  <button
                    onClick={() => gotoFrame(i)}
                    aria-label={`Frame ${i + 1}`}
                    aria-current={i === frameIdx}
                    className={`block overflow-hidden rounded border-2 ${
                      i === frameIdx ? "border-indigo-600" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Thumb frameId={id} layersRef={layersRef} rev={rev} />
                    <span className="block bg-gray-50 text-center text-xs tabular-nums text-gray-600">{i + 1}</span>
                  </button>
                </li>
              ))}
            </ol>
          </fieldset>
        </section>

        <p className="mt-2 text-sm text-gray-500">
          Hold Shift for straight lines, squares and circles. Ctrl/Cmd+Z undoes while you stay on a frame.
        </p>
      </main>

      {/* Layers */}
      <aside className="shrink-0 lg:w-56">
        <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <button onClick={() => addLayer(false)} disabled={layerList.length >= MAX_LAYERS} className={btn}>Add layer</button>
            <button onClick={() => addLayer(true)} disabled={layerList.length >= MAX_LAYERS} className={btn}>Add static layer</button>
            <button onClick={deleteLayer} disabled={layerList.length < 2} className={btn}>Delete</button>
            <button onClick={() => moveLayer(1)} className={btn} aria-label="Move layer up">Up</button>
            <button onClick={() => moveLayer(-1)} className={btn} aria-label="Move layer down">Down</button>
          </div>

          {/* flex-col-reverse puts the top layer first, like most paint apps */}
          <ul className="flex flex-col-reverse gap-1.5">
            {layerList.map((l) => (
              <li
                key={l.id}
                className={`rounded-md border p-2 ${
                  l.id === activeId ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisible(l.id)}
                    aria-pressed={l.visible}
                    className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    {l.visible ? "Shown" : "Hidden"}
                  </button>
                  <button onClick={() => selectLayer(l.id)} className="flex-1 truncate text-left text-sm text-gray-800">
                    {l.name}
                  </button>
                </div>
                {l.shared && <p className="mt-1 text-xs text-gray-500">Same on every frame</p>}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={l.opacity}
                  onChange={(e) => changeOpacity(l.id, +e.target.value)}
                  onPointerUp={endOpacity}
                  onKeyUp={endOpacity}
                  aria-label={`${l.name} opacity`}
                  className="mt-1.5 w-full accent-indigo-600"
                />
              </li>
            ))}
          </ul>
        </fieldset>
      </aside>
    </div>
  );
}