"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { contacts } from "@/lib/dummy-contacts";
import type { Contact } from "@/lib/dummy-contacts";
import Link from "next/link";

// --- Layout config ---

const COMPASS: Record<string, { label: string; angle: number }> = {
  Professional: { label: "Professional", angle: -Math.PI / 2 },   // North (up)
  Family:       { label: "Family",       angle: Math.PI / 2 },    // South (down)
  "LBS Cohort": { label: "Social",       angle: 0 },              // East (right)
  "Inner Circle":{ label: "Social",      angle: 0 },
  "Startup Network":{ label: "Community", angle: Math.PI },       // West (left)
};

const QUADRANT_ANGLES: Record<string, number> = {
  Professional: -Math.PI / 2,
  Family: Math.PI / 2,
  Social: 0,
  Community: Math.PI,
};

function folderToAngle(folder: string, seed: number): number {
  const entry = COMPASS[folder];
  const baseAngle = entry ? entry.angle : (seed * 2.39996); // golden angle fallback for "All"
  // Add jitter so bubbles don't stack
  return baseAngle + (Math.sin(seed * 127.1) * 0.6);
}

function contactToDistance(c: Contact, maxRadius: number): number {
  // Closer to center = more recently contacted
  const t = Math.min(c.lastContactedDaysAgo / 90, 1);
  return 40 + t * (maxRadius - 60);
}

function contactToColor(c: Contact): string {
  const days = c.lastContactedDaysAgo;
  if (days <= 7)  return "#22c55e"; // green
  if (days <= 14) return "#4ade80"; // light green
  if (days <= 30) return "#facc15"; // yellow
  if (days <= 50) return "#fb923c"; // orange
  if (days <= 70) return "#f97316"; // dark orange
  return "#ef4444";                 // red
}

// --- Physics node ---

interface Node {
  contact: Contact;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
}

interface TooltipData {
  contact: Contact;
  x: number;
  y: number;
}

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const animFrameRef = useRef<number>(0);
  const connectionsRef = useRef<Map<string, string[]>>(new Map());
  const hoveredNodeRef = useRef<Node | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // Initialize nodes
  const initNodes = useCallback((w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = Math.min(w, h) / 2 - 20;

    nodesRef.current = contacts.map((c, i) => {
      const angle = folderToAngle(c.folder, i);
      const dist = contactToDistance(c, maxRadius);
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist;
      // Start scattered, animate to position
      const startAngle = (i / contacts.length) * Math.PI * 2;
      const startDist = maxRadius * 0.3 + Math.random() * maxRadius * 0.5;
      return {
        contact: c,
        x: cx + Math.cos(startAngle) * startDist,
        y: cy + Math.sin(startAngle) * startDist,
        vx: 0,
        vy: 0,
        targetX: tx,
        targetY: ty,
        radius: 6 + Math.max(0, 10 - c.lastContactedDaysAgo / 10),
        color: contactToColor(c),
      };
    });

    // Generate deterministic connections: each node links to 2–4 others
    const map = new Map<string, string[]>();
    for (let i = 0; i < contacts.length; i++) {
      const count = 2 + Math.floor(Math.abs(Math.sin(i * 7.3)) * 3); // 2–4
      const connected: string[] = [];
      let attempt = 0;
      while (connected.length < count && attempt < 30) {
        const j = Math.floor(Math.abs(Math.sin(i * 13.7 + attempt * 5.1)) * contacts.length);
        if (j !== i && !connected.includes(contacts[j].id)) {
          connected.push(contacts[j].id);
        }
        attempt++;
      }
      map.set(contacts[i].id, connected);
    }
    connectionsRef.current = map;
  }, []);

  // Physics tick
  const tick = useCallback(() => {
    const nodes = nodesRef.current;
    const mouse = mouseRef.current;

    for (const node of nodes) {
      // Spring toward target
      const dx = node.targetX - node.x;
      const dy = node.targetY - node.y;
      node.vx += dx * 0.008;
      node.vy += dy * 0.008;

      // Mouse interaction: repel when moving fast, gentle ripple when slow/hovering
      const mx = node.x - mouse.x;
      const my = node.y - mouse.y;
      const mDist = Math.sqrt(mx * mx + my * my);
      if (mDist < 100 && mDist > 0) {
        const speed = mouse.speed;
        if (speed > 3) {
          // Fast cursor: gentle push (but not too strong so they stay reachable)
          const force = (100 - mDist) / 100;
          const strength = Math.min(speed / 20, 1) * 1.2;
          node.vx += (mx / mDist) * force * strength;
          node.vy += (my / mDist) * force * strength;
        } else if (mDist < 40) {
          // Slow/hovering cursor nearby: subtle wobble, no push away
          node.vx += Math.sin(Date.now() / 200 + node.x) * 0.1;
          node.vy += Math.cos(Date.now() / 200 + node.y) * 0.1;
        }
      }

      // Node-node repulsion (soft)
      for (const other of nodes) {
        if (other === node) continue;
        const ox = node.x - other.x;
        const oy = node.y - other.y;
        const oDist = Math.sqrt(ox * ox + oy * oy);
        const minDist = node.radius + other.radius + 4;
        if (oDist < minDist && oDist > 0) {
          const push = (minDist - oDist) / minDist;
          node.vx += (ox / oDist) * push * 1.5;
          node.vy += (oy / oDist) * push * 1.5;
        }
      }

      // Damping
      node.vx *= 0.88;
      node.vy *= 0.88;
      node.x += node.vx;
      node.y += node.vy;
    }
  }, []);

  // Draw
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) / 2 - 20;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, w * dpr, h * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Concentric zone rings
    const zones = [
      { r: maxR * 0.25, color: "rgba(34,197,94,0.04)" },
      { r: maxR * 0.50, color: "rgba(250,204,21,0.03)" },
      { r: maxR * 0.75, color: "rgba(249,115,22,0.03)" },
      { r: maxR * 1.00, color: "rgba(239,68,68,0.03)" },
    ];
    for (const zone of zones) {
      ctx.beginPath();
      ctx.arc(cx, cy, zone.r, 0, Math.PI * 2);
      ctx.fillStyle = zone.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Cross-hair lines (very subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.moveTo(cx - maxR, cy);
    ctx.lineTo(cx + maxR, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Compass labels
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const labels = [
      { text: "PROFESSIONAL", x: cx, y: cy - maxR - 14 },
      { text: "FAMILY", x: cx, y: cy + maxR + 14 },
      { text: "SOCIAL", x: cx + maxR + 8, y: cy },
      { text: "COMMUNITY", x: cx - maxR - 8, y: cy },
    ];
    for (const l of labels) {
      ctx.fillStyle = "rgba(139,92,246,0.5)";
      if (l.text === "SOCIAL" || l.text === "COMMUNITY") {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.text === "SOCIAL" ? -Math.PI / 2 : Math.PI / 2);
        ctx.fillText(l.text, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(l.text, l.x, l.y);
      }
    }

    // Connection lines — only for hovered node
    const hoveredNode = hoveredNodeRef.current;
    if (hoveredNode) {
      const connectedIds = connectionsRef.current.get(hoveredNode.contact.id) ?? [];
      for (const id of connectedIds) {
        const target = nodesRef.current.find((n) => n.contact.id === id);
        if (!target) continue;
        ctx.beginPath();
        ctx.moveTo(hoveredNode.x, hoveredNode.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = "rgba(139,92,246,0.45)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.stroke();
        // Small dot at connected node
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(139,92,246,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Bubbles
    for (const node of nodesRef.current) {
      // Glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = node.color.replace(")", ",0.15)").replace("rgb", "rgba");
      ctx.fill();

      // Main circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // First letter inside bubble if large enough
      if (node.radius >= 8) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = `bold ${Math.floor(node.radius * 0.9)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.contact.name[0], node.x, node.y + 0.5);
      }
    }

    // Center glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    grad.addColorStop(0, "rgba(139,92,246,0.08)");
    grad.addColorStop(1, "rgba(139,92,246,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement!;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      setDimensions({ w, h });
      initNodes(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d")!;
    const loop = () => {
      tick();
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      draw(ctx, w, h);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initNodes, tick, draw]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const prev = mouseRef.current;
    const dx = x - prev.x;
    const dy = y - prev.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    mouseRef.current = { x, y, prevX: prev.x, prevY: prev.y, speed };

    // Detect hovered node
    let closest: Node | null = null;
    let closestDist = Infinity;
    for (const node of nodesRef.current) {
      const ndx = x - node.x;
      const ndy = y - node.y;
      const d = Math.sqrt(ndx * ndx + ndy * ndy);
      if (d <= node.radius + 10 && d < closestDist) {
        closestDist = d;
        closest = node;
      }
    }
    hoveredNodeRef.current = closest;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    hoveredNodeRef.current = null;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const node of nodesRef.current) {
      const dx = mx - node.x;
      const dy = my - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 8) {
        setTooltip({ contact: node.contact, x: node.x, y: node.y });
        return;
      }
    }
    setTooltip(null);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    mouseRef.current = { x, y, prevX: x, prevY: y, speed: 0 };

    for (const node of nodesRef.current) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 12) {
        e.preventDefault();
        setTooltip({ contact: node.contact, x: node.x, y: node.y });
        hoveredNodeRef.current = node;
        return;
      }
    }
    setTooltip(null);
    hoveredNodeRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const prev = mouseRef.current;
    const speed = Math.sqrt((x - prev.x) ** 2 + (y - prev.y) ** 2);
    mouseRef.current = { x, y, prevX: prev.x, prevY: prev.y, speed };
  }, []);

  const handleTouchEnd = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    hoveredNodeRef.current = null;
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-100">Graph View</h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            Hover to interact. Click a bubble to see details. Center = recently contacted. Edges = drifting.
          </p>
          <p className="text-xs text-gray-500 sm:hidden">
            Tap a bubble to see details.
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {[
            { color: "#22c55e", label: "< 7d" },
            { color: "#facc15", label: "< 30d" },
            { color: "#fb923c", label: "< 50d" },
            { color: "#ef4444", label: "50d+" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[11px] text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative bg-gray-950/50 rounded-xl border border-gray-800/40 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full cursor-crosshair touch-manipulation"
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 pointer-events-auto"
            style={{
              left: dimensions.w < 500
                ? Math.max(8, Math.min(tooltip.x - 120, dimensions.w - 248))
                : Math.min(tooltip.x + 12, dimensions.w - 260),
              top: Math.max(tooltip.y - 20, 8),
            }}
          >
            <div className="bg-gray-900 border border-gray-700/60 rounded-xl p-4 shadow-xl shadow-black/40 w-60">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-100">{tooltip.contact.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Last contacted {tooltip.contact.lastContactedDaysAgo} days ago
                  </p>
                </div>
                <Link
                  href={`/people/${tooltip.contact.id}`}
                  className="p-1.5 rounded-md hover:bg-violet-500/15 text-gray-500 hover:text-violet-400 transition-colors"
                  title="View full profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </Link>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {tooltip.contact.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{tooltip.contact.summary}</p>
              <button
                onClick={() => setTooltip(null)}
                className="mt-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
              >
                dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
