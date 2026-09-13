"use client";

import React, { useState } from "react";
import { ThrottleCurvePoint } from "@/lib/types";

interface ThrottleCurvesChartProps {
  curveData: ThrottleCurvePoint[];
  hoverThrottlePct: number;
}

export const ThrottleCurvesChart: React.FC<ThrottleCurvesChartProps> = ({
  curveData,
  hoverThrottlePct
}) => {
  const [activeMetric, setActiveMetric] = useState<"thrust" | "power" | "current" | "voltage">("thrust");
  const [hoveredPoint, setHoveredPoint] = useState<ThrottleCurvePoint | null>(null);

  if (!curveData || curveData.length === 0) return null;

  // Chart dimensions
  const width = 650;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Compute metric min/max
  const getMetricValue = (p: ThrottleCurvePoint) => {
    switch (activeMetric) {
      case "thrust":
        return p.total_thrust_g;
      case "power":
        return p.total_power_w;
      case "current":
        return p.bus_current_a;
      case "voltage":
        return p.terminal_voltage_v;
    }
  };

  const getMetricUnit = () => {
    switch (activeMetric) {
      case "thrust":
        return "g";
      case "power":
        return "W";
      case "current":
        return "A";
      case "voltage":
        return "V";
    }
  };

  const getMetricColor = () => {
    switch (activeMetric) {
      case "thrust":
        return "#06b6d4"; // cyan
      case "power":
        return "#10b981"; // emerald
      case "current":
        return "#f59e0b"; // amber
      case "voltage":
        return "#f43f5e"; // rose
    }
  };

  const values = curveData.map(getMetricValue);
  const minVal = activeMetric === "voltage" ? Math.floor(Math.min(...values) * 0.95) : 0;
  const maxVal = Math.max(...values) * 1.05;

  // Generate SVG path
  const points = curveData.map((p) => {
    const x = padding.left + (p.throttle_pct / 100) * chartW;
    const y = padding.top + chartH - ((getMetricValue(p) - minVal) / (maxVal - minVal || 1)) * chartH;
    return { x, y, point: p };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  // Area under path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Hover throttle line position
  const hoverX = padding.left + (hoverThrottlePct / 100) * chartW;

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white font-mono">
            Throttle Dynamic Performance Sweep (0% → 100%)
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Hover over the curve to inspect rotational RPM, thrust authority, and bus current.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveMetric("thrust")}
            className={`px-2.5 py-1 rounded transition-all ${
              activeMetric === "thrust" ? "bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            Thrust (g)
          </button>
          <button
            onClick={() => setActiveMetric("power")}
            className={`px-2.5 py-1 rounded transition-all ${
              activeMetric === "power" ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            Power (W)
          </button>
          <button
            onClick={() => setActiveMetric("current")}
            className={`px-2.5 py-1 rounded transition-all ${
              activeMetric === "current" ? "bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            Current (A)
          </button>
          <button
            onClick={() => setActiveMetric("voltage")}
            className={`px-2.5 py-1 rounded transition-all ${
              activeMetric === "voltage" ? "bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            Voltage (V)
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[300px] select-none font-mono">
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={getMetricColor()} stopOpacity="0.3" />
              <stop offset="100%" stopColor={getMetricColor()} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const x = padding.left + (pct / 100) * chartW;
            return (
              <g key={pct}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartH}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={padding.top + chartH + 20}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Y Axis Grid */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const y = padding.top + chartH - ratio * chartH;
            const val = minVal + ratio * (maxVal - minVal);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                >
                  {val >= 100 ? Math.round(val) : val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Hover Throttle Marker Line */}
          {hoverThrottlePct > 0 && (
            <g>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={padding.top + chartH}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text
                x={hoverX}
                y={padding.top - 8}
                fill="#10b981"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                Hover Point ({hoverThrottlePct}%)
              </text>
            </g>
          )}

          {/* Area and Line */}
          <path d={areaD} fill="url(#curveGradient)" />
          <path
            d={pathD}
            fill="none"
            stroke={getMetricColor()}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.throttle_pct === pt.point.throttle_pct ? 6 : 3.5}
              fill="#0c1222"
              stroke={getMetricColor()}
              strokeWidth="2"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPoint(pt.point)}
            />
          ))}
        </svg>
      </div>

      {/* Hover Telemetry Readout */}
      <div className="mt-3 py-2 px-4 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between text-xs font-mono">
        {hoveredPoint ? (
          <>
            <div>Throttle: <strong className="text-cyan-400">{hoveredPoint.throttle_pct}%</strong></div>
            <div>Thrust: <strong className="text-slate-200">{hoveredPoint.total_thrust_g}g ({hoveredPoint.total_thrust_n}N)</strong></div>
            <div>RPM: <strong className="text-slate-200">{hoveredPoint.rotational_speed_rpm}</strong></div>
            <div>Current: <strong className="text-amber-400">{hoveredPoint.bus_current_a}A</strong></div>
            <div>Power: <strong className="text-emerald-400">{hoveredPoint.total_power_w}W</strong></div>
            <div>Voltage: <strong className="text-rose-400">{hoveredPoint.terminal_voltage_v}V</strong></div>
          </>
        ) : (
          <span className="text-slate-500">
            Hover over points on the graph above to see exact RPM, current draw, and power ratings.
          </span>
        )}
      </div>
    </div>
  );
};
