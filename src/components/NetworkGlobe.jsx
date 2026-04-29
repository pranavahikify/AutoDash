import { useEffect, useRef } from 'react';

/* ─── City/node positions (lat, lng in degrees) ─────────── */
const NODES = [
  { lat: 40.7, lng: -74.0 },   // New York
  { lat: 51.5, lng: -0.1 },    // London
  { lat: 35.7, lng: 139.7 },   // Tokyo
  { lat: 22.3, lng: 114.2 },   // Hong Kong
  { lat: 37.8, lng: -122.4 },  // San Francisco
  { lat: 48.9, lng: 2.3 },     // Paris
  { lat: 55.8, lng: 37.6 },    // Moscow
  { lat: 19.1, lng: 72.9 },    // Mumbai
  { lat: -33.9, lng: 18.4 },   // Cape Town
  { lat: -23.6, lng: -46.6 },  // São Paulo
  { lat: 1.3, lng: 103.8 },    // Singapore
  { lat: 25.2, lng: 55.3 },    // Dubai
  { lat: 52.5, lng: 13.4 },    // Berlin
  { lat: 41.9, lng: 12.5 },    // Rome
  { lat: -37.8, lng: 144.9 },  // Melbourne
  { lat: 39.9, lng: 116.4 },   // Beijing
  { lat: 28.6, lng: 77.2 },    // Delhi
  { lat: 6.5, lng: 3.4 },      // Lagos
  { lat: 43.7, lng: -79.4 },   // Toronto
  { lat: 59.9, lng: 10.7 },    // Oslo
];

/* ─── Which nodes are connected ─────────────────────────── */
const CONNECTIONS = [
  [0, 1], [0, 4], [0, 18], [1, 5], [1, 6], [1, 12], [1, 13],
  [2, 3], [2, 10], [2, 15], [3, 11], [3, 10], [4, 18], [4, 0],
  [5, 12], [5, 1], [6, 16], [7, 11], [7, 3], [8, 5], [8, 17],
  [9, 0], [9, 5], [10, 11], [11, 7], [12, 13], [14, 10], [15, 2],
  [16, 7], [17, 11], [18, 0], [19, 1], [19, 6],
];

function toXYZ(lat, lng, r, rotation) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + rotation) * (Math.PI / 180);
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

function project(x, y, z, cx, cy, fov = 900) {
  const scale = fov / (fov + z);
  return { px: cx + x * scale, py: cy - y * scale, scale };
}

export default function NetworkGlobe({ size = 480 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const rotRef = useRef(0);
  const packetsRef = useRef([]); // animated data packets on connections

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const R = size * 0.38;       // globe radius
    const cx = size / 2;
    const cy = size / 2;
    const DPR = window.devicePixelRatio || 1;

    canvas.width = size * DPR;
    canvas.height = size * DPR;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(DPR, DPR);

    /* Seed initial packets */
    CONNECTIONS.forEach((conn, i) => {
      if (i % 2 === 0) {
        packetsRef.current.push({ conn, t: Math.random(), speed: 0.003 + Math.random() * 0.004 });
      }
    });

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const rot = rotRef.current;

      /* ── Atmospheric outer glow ──────────────────────── */
      const atm = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.28);
      atm.addColorStop(0, 'rgba(37,99,235,0.18)');
      atm.addColorStop(0.5, 'rgba(37,99,235,0.07)');
      atm.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
      ctx.fillStyle = atm;
      ctx.fill();

      /* ── Globe base ──────────────────────────────────── */
      const globeGrad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.2, R * 0.05, cx, cy, R);
      globeGrad.addColorStop(0, 'rgba(30,58,138,0.55)');
      globeGrad.addColorStop(0.5, 'rgba(15,30,80,0.72)');
      globeGrad.addColorStop(1, 'rgba(5,11,24,0.9)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = globeGrad;
      ctx.fill();

      /* ── Globe border glow ───────────────────────────── */
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(37,99,235,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* ── Latitude / Longitude grid lines ─────────────── */
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Latitude rings
      for (let lat = -60; lat <= 60; lat += 30) {
        const points = [];
        for (let lng = 0; lng < 360; lng += 4) {
          const { x, y, z } = toXYZ(lat, lng, R, rot);
          const p = project(x, y, z, cx, cy);
          if (z > -R * 0.1) points.push(p);
        }
        if (points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(points[0].px, points[0].py);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].px, points[i].py);
        ctx.strokeStyle = 'rgba(96,165,250,0.10)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Longitude lines
      for (let lng = 0; lng < 360; lng += 30) {
        const points = [];
        for (let lat = -90; lat <= 90; lat += 4) {
          const { x, y, z } = toXYZ(lat, lng, R, rot);
          const p = project(x, y, z, cx, cy);
          if (z > -R * 0.1) points.push(p);
        }
        if (points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(points[0].px, points[0].py);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].px, points[i].py);
        ctx.strokeStyle = 'rgba(96,165,250,0.10)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.restore();

      /* ── Compute node positions ───────────────────────── */
      const nodePos = NODES.map(n => {
        const { x, y, z } = toXYZ(n.lat, n.lng, R, rot);
        const { px, py, scale } = project(x, y, z, cx, cy);
        const visible = z > -R * 0.15;
        return { px, py, scale, visible, z };
      });

      /* ── Connection arcs ─────────────────────────────── */
      CONNECTIONS.forEach(([a, b]) => {
        const A = nodePos[a], B = nodePos[b];
        if (!A.visible || !B.visible) return;

        // Midpoint slightly above the sphere surface for arc
        const mx = (A.px + B.px) / 2;
        const my = (A.py + B.py) / 2;
        const dx = B.px - A.px, dy = B.py - A.py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const alpha = Math.min(A.scale, B.scale) * 0.45;
        const grad = ctx.createLinearGradient(A.px, A.py, B.px, B.py);
        grad.addColorStop(0, `rgba(37,99,235,${alpha})`);
        grad.addColorStop(0.5, `rgba(96,165,250,${alpha * 1.4})`);
        grad.addColorStop(1, `rgba(37,99,235,${alpha})`);

        // Curved arc using quadratic bezier lifted toward viewer
        const lift = -dist * 0.22;
        const cpx = mx - dy * 0.1;
        const cpy = my + lift;

        ctx.beginPath();
        ctx.moveTo(A.px, A.py);
        ctx.quadraticCurveTo(cpx, cpy, B.px, B.py);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      /* ── Animated data packets ───────────────────────── */
      packetsRef.current.forEach(pkt => {
        pkt.t += pkt.speed;
        if (pkt.t > 1) pkt.t = 0;

        const [a, b] = pkt.conn;
        const A = nodePos[a], B = nodePos[b];
        if (!A.visible || !B.visible) return;

        const t = pkt.t;
        const dist = Math.sqrt((B.px - A.px) ** 2 + (B.py - A.py) ** 2);
        const lift = -dist * 0.22;
        const mx = (A.px + B.px) / 2;
        const my = (A.py + B.py) / 2;
        const dx = B.px - A.px, dy = B.py - A.py;
        const cpx = mx - dy * 0.1, cpy = my + lift;

        // Bezier point at t
        const px2 = (1 - t) * (1 - t) * A.px + 2 * (1 - t) * t * cpx + t * t * B.px;
        const py2 = (1 - t) * (1 - t) * A.py + 2 * (1 - t) * t * cpy + t * t * B.py;

        const glow = ctx.createRadialGradient(px2, py2, 0, px2, py2, 5);
        glow.addColorStop(0, 'rgba(147,197,253,0.95)');
        glow.addColorStop(0.5, 'rgba(37,99,235,0.5)');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(px2, py2, 5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      });

      /* ── Node dots ───────────────────────────────────── */
      nodePos.forEach(({ px, py, scale, visible }, i) => {
        if (!visible) return;
        const r = scale * 5;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 3.5);
        glow.addColorStop(0, 'rgba(147,197,253,1)');
        glow.addColorStop(0.4, 'rgba(59,130,246,0.6)');
        glow.addColorStop(1, 'transparent');

        // Outer glow
        ctx.beginPath();
        ctx.arc(px, py, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = '#93C5FD';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      /* ── Specular highlight ──────────────────────────── */
      const spec = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, 0, cx - R * 0.2, cy - R * 0.2, R * 0.55);
      spec.addColorStop(0, 'rgba(255,255,255,0.10)');
      spec.addColorStop(1, 'transparent');
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = spec;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      rotRef.current += 0.18;
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', background: 'transparent' }}
    />
  );
}
