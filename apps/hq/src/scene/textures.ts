/**
 * Every texture is painted in code on a canvas: no external image assets. Screens
 * use invented "branded travel imagery" placeholders, never real client media.
 */
import * as THREE from "three";

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const cache = new Map<string, THREE.CanvasTexture>();

function make(key: string, w: number, h: number, paint: Painter, opts: { srgb?: boolean; repeat?: boolean } = {}): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  paint(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (opts.repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

function rng(seed: number): () => number {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "system-ui, 'Segoe UI', Helvetica, Arial, sans-serif";

/* ---------- travel imagery ---------- */

const SCENES: [string, string, string, string, string][] = [
  // sky top, sky horizon, sea, sand, foliage
  ["#3f8fd2", "#ffd9a0", "#1fb4b8", "#f3dcae", "#1f5e2e"],
  ["#2b5f9e", "#f79a5b", "#167e96", "#e9c58f", "#173f22"],
  ["#79c6e8", "#e7f4f5", "#27c4c0", "#f7e7c6", "#2a7a3c"],
  ["#5a3f83", "#f5825a", "#225d83", "#d9a878", "#1a3322"],
  ["#4fa8dd", "#fff0c9", "#0e9fb0", "#f1dcb0", "#2c6b34"],
  ["#d9713b", "#ffc76e", "#b4764a", "#e4b983", "#3b2c1c"],
];

function palmSilhouette(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string, lean: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = h * 0.045;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.5, x + lean * h, y - h);
  ctx.stroke();
  const tx = x + lean * h;
  const ty = y - h;
  ctx.lineWidth = h * 0.028;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * h * 0.26, ty - h * 0.14 + Math.sin(a) * h * 0.05, tx + Math.cos(a) * h * 0.42, ty + h * 0.1);
    ctx.stroke();
  }
}

function paintTravel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  const s = SCENES[seed % SCENES.length] as [string, string, string, string, string];
  const r = rng(seed + 3);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const horizon = y + h * (0.42 + r() * 0.1);
  const sky = ctx.createLinearGradient(0, y, 0, horizon);
  sky.addColorStop(0, s[0]);
  sky.addColorStop(1, s[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, horizon - y);
  const sunX = x + w * (0.3 + r() * 0.4);
  const sun = ctx.createRadialGradient(sunX, horizon, 2, sunX, horizon, h * 0.4);
  sun.addColorStop(0, "rgba(255,240,200,.95)");
  sun.addColorStop(1, "rgba(255,240,200,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(x, y, w, h);
  const sea = ctx.createLinearGradient(0, horizon, 0, y + h);
  sea.addColorStop(0, s[2]);
  sea.addColorStop(1, "#7fe0d0");
  ctx.fillStyle = sea;
  ctx.fillRect(x, horizon, w, h);
  // Hills across the horizon.
  ctx.fillStyle = s[4];
  ctx.beginPath();
  ctx.moveTo(x, horizon);
  for (let i = 0; i <= 8; i++) ctx.lineTo(x + (i / 8) * w, horizon - r() * h * 0.11);
  ctx.lineTo(x + w, horizon);
  ctx.fill();
  // Beach.
  ctx.fillStyle = s[3];
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.72);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * (0.74 + r() * 0.14), x + w, y + h * 0.9);
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  palmSilhouette(ctx, x + w * 0.12, y + h * 0.93, h * 0.72, s[4], 0.14);
  palmSilhouette(ctx, x + w * 0.86, y + h * 0.98, h * 0.58, s[4], -0.16);
  ctx.restore();
}

export function travelTexture(seed: number): THREE.CanvasTexture {
  return make(`travel-${seed % 12}`, 384, 216, (ctx, w, h) => paintTravel(ctx, 0, 0, w, h, seed));
}

/** A dark editor UI with a travel frame, timeline and waveform. */
export function editorTexture(seed: number): THREE.CanvasTexture {
  return make(`editor-${seed % 6}`, 512, 288, (ctx, w, h) => {
    ctx.fillStyle = "#14161b";
    ctx.fillRect(0, 0, w, h);
    paintTravel(ctx, w * 0.2, 12, w * 0.76, h * 0.56, seed);
    const r = rng(seed + 8);
    for (let i = 0; i < 6; i++) {
      paintTravel(ctx, 8, 12 + i * 28, w * 0.17, 24, seed + i + 1);
    }
    ctx.fillStyle = "#1f232b";
    ctx.fillRect(8, h * 0.66, w - 16, h * 0.3);
    const colors = ["#3fa7d6", "#d4a853", "#c17a4a", "#59c19a"];
    for (let row = 0; row < 3; row++) {
      let x = 12;
      while (x < w - 20) {
        const len = 24 + r() * 74;
        ctx.fillStyle = colors[(row + Math.floor(r() * 4)) % 4] as string;
        ctx.fillRect(x, h * 0.68 + row * 24, Math.min(len, w - 14 - x), 18);
        x += len + 4;
      }
    }
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(w * (0.3 + r() * 0.4), h * 0.65, 2, h * 0.32);
  });
}

/* ---------- signage ---------- */

export function studioSignTexture(): THREE.CanvasTexture {
  return make("studio-sign", 1024, 300, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#142a4d");
    g.addColorStop(1, "#22436f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f7f4ee";
    ctx.textAlign = "center";
    ctx.font = `600 104px ${SANS}`;
    ctx.fillText("CONTENT STUDIO", w / 2, 138);
    ctx.fillStyle = "#e7c67e";
    ctx.font = `500 46px ${SANS}`;
    ctx.fillText("Create · Edit · Enhance · Deliver", w / 2, 224);
  });
}

export function titleBoard(key: string, title: string, sub: string): THREE.CanvasTexture {
  return make(`title-${key}`, 768, 240, (ctx, w, h) => {
    ctx.fillStyle = "#2c2420";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#d4a853";
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = "#fbf5ed";
    ctx.textAlign = "center";
    ctx.font = `600 66px ${SERIF}`;
    ctx.fillText(title, w / 2, 112, w - 40);
    ctx.fillStyle = "#d4a853";
    ctx.font = `500 30px ${SANS}`;
    ctx.fillText(sub, w / 2, 178, w - 40);
  });
}

/* ---------- department boards ---------- */

export function mapTexture(): THREE.CanvasTexture {
  return make("map", 768, 400, (ctx, w, h) => {
    ctx.fillStyle = "#123a54";
    ctx.fillRect(0, 0, w, h);
    const r = rng(42);
    ctx.fillStyle = "#3f8a6e";
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 22 + r() * 80, 12 + r() * 46, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    for (let i = 1; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo((i / 12) * w, 0);
      ctx.lineTo((i / 12) * w, h);
      ctx.moveTo(0, (i / 12) * h);
      ctx.lineTo(w, (i / 12) * h);
      ctx.stroke();
    }
    ctx.fillStyle = "#d4a853";
    ctx.strokeStyle = "#d4a853";
    let px = 0;
    let py = 0;
    for (let i = 0; i < 9; i++) {
      const x = 40 + r() * (w - 80);
      const y = 30 + r() * (h - 60);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      if (i > 0 && i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      px = x;
      py = y;
    }
  });
}

export function calendarTexture(): THREE.CanvasTexture {
  return make("calendar", 900, 420, (ctx, w, h) => {
    ctx.fillStyle = "#fbf5ed";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2c2420";
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = "#d4a853";
    ctx.font = `600 30px ${SERIF}`;
    ctx.fillText("Publishing Calendar", 18, 36);
    const r = rng(11);
    const cols = 7;
    const rows = 5;
    const cw = w / cols;
    const ch = (h - 52) / rows;
    const tag = ["#c17a4a", "#3fa7d6", "#59c19a", "#d4a853", "#8b6e52"];
    ctx.strokeStyle = "#e8dccb";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.strokeRect(x * cw, 52 + y * ch, cw, ch);
        const n = Math.floor(r() * 3);
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = tag[Math.floor(r() * tag.length)] as string;
          ctx.fillRect(x * cw + 8, 60 + y * ch + k * 20, cw - 16, 15);
        }
      }
    }
  });
}

export function chartTexture(seed: number): THREE.CanvasTexture {
  return make(`chart-${seed % 4}`, 512, 288, (ctx, w, h) => {
    ctx.fillStyle = "#17202a";
    ctx.fillRect(0, 0, w, h);
    const r = rng(seed + 4);
    ctx.strokeStyle = "rgba(255,255,255,.1)";
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(16, (i / 6) * h);
      ctx.lineTo(w - 16, (i / 6) * h);
      ctx.stroke();
    }
    if (seed % 2 === 0) {
      for (let i = 0; i < 12; i++) {
        const v = 0.2 + r() * 0.7;
        ctx.fillStyle = i % 3 === 0 ? "#d4a853" : "#3fd0c9";
        ctx.fillRect(22 + i * 39, h - 14 - v * (h - 40), 26, v * (h - 40));
      }
    } else {
      for (const c of ["#3fd0c9", "#d4a853"]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = 4;
        ctx.beginPath();
        let v = 0.25 + r() * 0.2;
        for (let i = 0; i <= 14; i++) {
          v = Math.min(0.92, Math.max(0.08, v + (r() - 0.38) * 0.16));
          const x = 16 + (i / 14) * (w - 32);
          const y = h - 12 - v * (h - 30);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  });
}

export function storyboardTexture(): THREE.CanvasTexture {
  return make("storyboard", 900, 360, (ctx, w, h) => {
    ctx.fillStyle = "#efe6d6";
    ctx.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 5; x++) {
        const px = 18 + x * 176;
        const py = 18 + y * 170;
        ctx.save();
        ctx.translate(px + 80, py + 72);
        ctx.rotate((r() - 0.5) * 0.05);
        ctx.fillStyle = "#fff";
        ctx.fillRect(-80, -72, 160, 144);
        paintTravel(ctx, -74, -66, 148, 84, x + y * 5);
        ctx.fillStyle = "#8b6e52";
        ctx.fillRect(-72, 26, 110, 7);
        ctx.fillRect(-72, 42, 136, 7);
        ctx.restore();
      }
    }
  });
}

export function listBoardTexture(key: string, title: string, rows: string[], accent: string): THREE.CanvasTexture {
  return make(`list-${key}`, 720, 420, (ctx, w, h) => {
    ctx.fillStyle = "#1f2a33";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.font = `600 38px ${SERIF}`;
    ctx.fillText(title, 24, 50);
    ctx.font = `500 25px ${SANS}`;
    rows.forEach((row, i) => {
      const y = 92 + i * 52;
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fillRect(18, y, w - 36, 44);
      ctx.fillStyle = accent;
      ctx.fillRect(18, y, 6, 44);
      ctx.fillStyle = "#fbf5ed";
      ctx.fillText(row, 38, y + 30, w - 70);
    });
  });
}

/* ---------- world details ---------- */

export function helipadTexture(): THREE.CanvasTexture {
  return make("helipad", 512, 512, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = "#3b3a39";
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e9dfc9";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#d4a853";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f4efe6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 230px ${SANS}`;
    ctx.fillText("H", c, c + 10);
  });
}

/** Warm, lit-room impression behind the glass, used from far away. */
export function interiorGlowTexture(): THREE.CanvasTexture {
  return make("interior-glow", 512, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, "#ffd79a");
    g.addColorStop(0.5, "#f7b263");
    g.addColorStop(1, "#b97434");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rng(21);
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const bw = 6 + r() * 26;
      const bh = 22 + r() * 58;
      ctx.fillStyle = `rgba(70,42,24,${0.16 + r() * 0.34})`;
      ctx.fillRect(x, h - bh, bw, bh);
    }
    for (let i = 0; i < 10; i++) {
      const x = r() * w;
      ctx.fillStyle = "rgba(255,246,220,.75)";
      ctx.fillRect(x, 6 + r() * 12, 26, 3);
    }
  }, { repeat: true });
}

/** Warm honed stone, large-format tiles with soft veining. */
export function floorTexture(): THREE.CanvasTexture {
  return make("floor", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#c9b499";
    ctx.fillRect(0, 0, w, h);
    const r = rng(31);
    for (let i = 0; i < 90; i++) {
      ctx.strokeStyle = `rgba(${90 + r() * 50},${66 + r() * 40},${44 + r() * 30},${0.05 + r() * 0.08})`;
      ctx.lineWidth = 1 + r() * 2.2;
      ctx.beginPath();
      let x = r() * w;
      let y = r() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (r() - 0.5) * 90;
        y += (r() - 0.5) * 90;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(70,50,34,.32)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo((i * w) / 2, 0);
      ctx.lineTo((i * w) / 2, h);
      ctx.moveTo(0, (i * h) / 2);
      ctx.lineTo(w, (i * h) / 2);
      ctx.stroke();
    }
  }, { repeat: true });
}

export function palmFrondTexture(): THREE.CanvasTexture {
  return make("frond", 128, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const r = rng(5);
    // v runs from the trunk (bottom of the canvas) to the tip. Three.js flips Y, so
    // draw with the trunk at the bottom.
    const teeth = 17;
    const halfWidth = (t: number) => (w / 2) * 0.96 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)), 0.62);
    ctx.beginPath();
    ctx.moveTo(cx, h);
    for (const side of [-1, 1]) {
      for (let i = 0; i <= teeth; i++) {
        const k = side < 0 ? i : teeth - i;
        const t = k / teeth;
        const tNotch = (k + 0.5) / teeth;
        const y = h - t * h;
        ctx.lineTo(cx + side * halfWidth(t), y - 6);
        if (k < teeth) ctx.lineTo(cx + side * halfWidth(tNotch) * 0.3, h - tNotch * h + 13);
      }
    }
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, "#5f8a33");
    grad.addColorStop(0.45, "#a9cf5c");
    grad.addColorStop(1, "#e4ea8c");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 44; i++) {
      const y = (i / 44) * h;
      for (const side of [-1, 1]) {
        ctx.strokeStyle = `rgba(${40 + r() * 30},${80 + r() * 40},${30 + r() * 20},${0.25 + r() * 0.2})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx + side * (w / 2), y - 26);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = "#d9d48a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
  });
}

export function leafClumpTexture(): THREE.CanvasTexture {
  return make("leaves", 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 230; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * w * 0.46;
      const x = w / 2 + Math.cos(a) * d;
      const y = h / 2 + Math.sin(a) * d;
      const bright = 0.55 + r() * 0.45 - (y / h) * 0.32;
      ctx.fillStyle = `rgb(${Math.floor(150 * bright + 40)},${Math.floor(225 * bright + 20)},${Math.floor(90 * bright + 10)})`;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r() * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 13 + r() * 12, 4 + r() * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
}

export function softGlowTexture(): THREE.CanvasTexture {
  return make("glow", 128, 128, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(255,255,255,.5)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  });
}

export function cloudTexture(): THREE.CanvasTexture {
  return make("cloud", 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 40; i++) {
      const x = w / 2 + (r() - 0.5) * w * 0.66;
      const y = h / 2 + (r() - 0.5) * h * 0.26;
      const rad = 18 + r() * 42;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, "rgba(255,246,232,.32)");
      g.addColorStop(1, "rgba(255,246,232,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  });
}

export function printTexture(base: string, printColor: string): THREE.CanvasTexture {
  return make(`print-${base}-${printColor}`, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const r = rng(17);
    ctx.fillStyle = printColor;
    for (let i = 0; i < 12; i++) {
      const x = r() * w;
      const y = r() * h;
      for (let k = 0; k < 6; k++) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((k / 6) * Math.PI * 2 + r());
        ctx.beginPath();
        ctx.ellipse(8, 0, 9, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }, { repeat: true });
}
