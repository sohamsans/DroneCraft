"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDroneStore } from "@/lib/store";
import { Layers, RotateCcw, AlertTriangle, CheckCircle2, Maximize2, Shield } from "lucide-react";

export const DroneViewer3D: React.FC = () => {
  const { selectedFrame, selectedProp, simulation } = useDroneStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [rotation, setRotation] = useState({ pitch: 25, yaw: 45 });
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const numRotors = simulation?.mass.num_rotors || 4;
  const wheelbaseMm = selectedFrame?.wheelbase_mm || 220.0;
  const maxPropInch = selectedFrame?.max_prop_size_inch || 5.1;
  const propDiaInch = selectedProp?.diameter_inch || 5.0;

  const propDiaMm = propDiaInch * 25.4;
  const propRadiusMm = propDiaMm / 2.0;
  const hubRadiusMm = wheelbaseMm / 2.0;

  // Angular spacing between rotors
  const angleStep = (2 * Math.PI) / numRotors;
  
  // Distance between adjacent motor hubs
  const adjacentHubDistMm = 2 * hubRadiusMm * Math.sin(Math.PI / numRotors);
  // Tip to tip clearance
  const tipClearanceMm = adjacentHubDistMm - (2 * propRadiusMm);
  const hasInterference = propDiaInch > maxPropInch || tipClearanceMm < 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const centerX = w / 2;
    const centerY = h / 2;

    // Scale factor: fit drone to canvas
    const maxDimensionMm = Math.max(wheelbaseMm + propDiaMm * 1.2, 300);
    const scale = (Math.min(w, h) * 0.38 * zoom) / (maxDimensionMm / 2);

    // Clear background
    ctx.clearRect(0, 0, w, h);

    // Draw Isometric/Perspective Grid
    ctx.save();
    ctx.translate(centerX, centerY);

    // Draw coordinate radar rings
    for (let r = 50; r <= 300; r += 50) {
      ctx.beginPath();
      ctx.arc(0, 0, r * scale, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Calculate rotor positions in 2D projected space with pitch/yaw
    const pitchRad = (rotation.pitch * Math.PI) / 180;
    const yawRad = (rotation.yaw * Math.PI) / 180;

    const project = (xMm: number, yMm: number, zMm: number = 0) => {
      // Rotate around Z (yaw)
      const x1 = xMm * Math.cos(yawRad) - yMm * Math.sin(yawRad);
      const y1 = xMm * Math.sin(yawRad) + yMm * Math.cos(yawRad);
      // Project with pitch
      const px = x1 * scale;
      const py = (y1 * Math.cos(pitchRad) - zMm * Math.sin(pitchRad)) * scale;
      return { px, py };
    };

    // 1. Draw Central Fuselage Stack
    const bodyRadius = 25;
    ctx.beginPath();
    ctx.arc(0, 0, bodyRadius * scale, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Center Crosshair
    ctx.beginPath();
    ctx.moveTo(-10 * scale, 0);
    ctx.lineTo(10 * scale, 0);
    ctx.moveTo(0, -10 * scale);
    ctx.lineTo(0, 10 * scale);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Draw Frame Arms and Motors
    const rotorPoints: { px: number; py: number; rawX: number; rawY: number }[] = [];

    for (let i = 0; i < numRotors; i++) {
      // Quad-X typically 45, 135, 225, 315 deg
      const offsetAngle = numRotors === 4 ? Math.PI / 4 : 0;
      const angle = i * angleStep + offsetAngle;

      const rawX = hubRadiusMm * Math.cos(angle);
      const rawY = hubRadiusMm * Math.sin(angle);
      const { px, py } = project(rawX, rawY);

      rotorPoints.push({ px, py, rawX, rawY });

      // Draw Carbon Arm Line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 4 * Math.max(1, zoom);
      ctx.stroke();

      // Motor Hub Circle
      ctx.beginPath();
      ctx.arc(px, py, 12 * scale, 0, 2 * Math.PI);
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Draw Propeller Disc Radius
      ctx.beginPath();
      // Elliptical disc due to perspective
      ctx.ellipse(
        px,
        py,
        propRadiusMm * scale,
        propRadiusMm * scale * Math.cos(pitchRad),
        0,
        0,
        2 * Math.PI
      );

      if (hasInterference) {
        ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 1.5;
      }
      ctx.fill();
      ctx.stroke();

      // Rotor Index Label
      ctx.fillStyle = "#f8fafc";
      ctx.font = `bold ${Math.round(11 * Math.max(0.8, zoom))}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`M${i + 1}`, px, py);
    }

    // 3. Draw Clearance Lines Between Adjacent Propellers
    for (let i = 0; i < numRotors; i++) {
      const nextIdx = (i + 1) % numRotors;
      const p1 = rotorPoints[i];
      const p2 = rotorPoints[nextIdx];

      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.strokeStyle = hasInterference ? "rgba(244, 63, 94, 0.6)" : "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [selectedFrame, selectedProp, simulation, rotation, zoom, hasInterference]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation((prev) => ({
      pitch: Math.max(0, Math.min(85, prev.pitch + dy * 0.4)),
      yaw: (prev.yaw + dx * 0.5) % 360,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-6">
      {/* 3D Viewport Glass Panel */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        {/* Header with Geometry Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Dynamic 3D Frame Envelope & Propeller Clearance Visualizer
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Interactive 3D geometry engine calculating arm kinematics, disc overlaps, and ground clearance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRotation({ pitch: 25, yaw: 45 });
                setZoom(1.0);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Camera</span>
            </button>
          </div>
        </div>

        {/* Status Clearance Badge Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            Wheelbase: <strong className="text-cyan-400">{wheelbaseMm}mm</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            Prop Diameter: <strong className="text-purple-400">{propDiaInch}&quot; ({propDiaMm.toFixed(1)}mm)</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            Frame Max Prop: <strong className="text-slate-200">{maxPropInch}&quot;</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            Adjacent Tip Clearance:{" "}
            <strong className={tipClearanceMm < 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
              {tipClearanceMm.toFixed(1)}mm
            </strong>
          </div>

          {hasInterference ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4" /> GEOMETRIC COLLISION DETECTED
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
              <CheckCircle2 className="w-4 h-4" /> SAFE CLEARANCE
            </span>
          )}
        </div>

        {/* 3D Canvas Area */}
        <div
          className="relative w-full h-[420px] bg-[#070b14] rounded-xl border border-slate-800/80 cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={(e) => {
            e.preventDefault();
            setZoom((prev) => Math.max(0.5, Math.min(2.5, prev - e.deltaY * 0.001)));
          }}
        >
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Compass / Angle Overlay in Bottom Corner */}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 pointer-events-none">
            Pitch: {rotation.pitch} deg | Yaw: {rotation.yaw} deg | Zoom: {zoom.toFixed(1)}x
          </div>

          {/* Overlay Helper Instruction */}
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 pointer-events-none">
            Click & Drag to Orbit | Scroll to Zoom
          </div>
        </div>
      </div>
    </div>
  );
};
