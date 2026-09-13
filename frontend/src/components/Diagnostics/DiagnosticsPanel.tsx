"use client";

import React, { useState } from "react";
import { useDroneStore } from "@/lib/store";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Info,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

export const DiagnosticsPanel: React.FC = () => {
  const { diagnostics, simulation, setPickerCategory, setActiveTab } = useDroneStore();
  const [filter, setFilter] = useState<string>("ALL");

  if (!diagnostics) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-slate-400 font-mono">
        <ShieldCheck className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
        <p>No diagnostics available. Please configure your drone to run safety audit.</p>
      </div>
    );
  }

  const { health_score, is_flight_ready, status, summary, rules, action_items } = diagnostics;

  const filteredRules = rules.filter((r) => {
    if (filter === "ALL") return true;
    if (filter === "FAILURES") return !r.passed;
    return r.severity === filter;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "FATAL":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5" /> FATAL
          </span>
        );
      case "CRITICAL":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <AlertOctagon className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case "WARNING":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      case "INFO":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Info className="w-3.5 h-3.5" /> INFO
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500";
    if (score >= 60) return "text-yellow-400 border-yellow-500";
    if (score >= 40) return "text-amber-400 border-amber-500";
    return "text-rose-500 border-rose-500";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Health Score & Readiness */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Circular Score Dial */}
          <div className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center bg-slate-950/80 shadow-2xl ${getScoreColor(health_score)}`}>
            <div className="text-center">
              <span className="text-2xl font-black font-mono">{health_score}</span>
              <span className="text-[10px] text-slate-400 font-mono block">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Powertrain Health & Safety Audit</h2>
              {is_flight_ready ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-semibold">
                  Flight Ready
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-mono font-semibold">
                  Unsafe / Action Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Status: <strong className="text-slate-200">{status}</strong>. {summary.passed_count} of {summary.total_checks} deterministic physics checks verified.
            </p>
          </div>
        </div>

        {/* Severity Summary Counter Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">FATAL</span>
            <strong className="text-rose-400 text-sm">{summary.fatal_count}</strong>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">CRITICAL</span>
            <strong className="text-amber-400 text-sm">{summary.critical_count}</strong>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">WARNING</span>
            <strong className="text-yellow-400 text-sm">{summary.warning_count}</strong>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">PASSED</span>
            <strong className="text-emerald-400 text-sm">{summary.passed_count}</strong>
          </div>
        </div>
      </div>

      {/* Priority Action Recommendations Drawer */}
      {action_items.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-amber-500">
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Recommended Action Items ({action_items.length})
          </h3>

          <div className="space-y-3">
            {action_items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(item.severity)}
                    <span className="text-xs text-slate-400 uppercase tracking-wider">{item.category}</span>
                    <strong className="text-sm text-slate-100">{item.title}</strong>
                  </div>
                  <p className="text-xs text-slate-300 pl-1">{item.issue}</p>
                  <p className="text-xs text-emerald-400 pl-1 font-semibold">
                    Fix: {item.recommendation}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (item.category.includes("Geometry") || item.title.includes("Propeller")) {
                      setPickerCategory("propellers");
                    } else if (item.category.includes("ESC")) {
                      setPickerCategory("escs");
                    } else if (item.category.includes("Battery") || item.title.includes("Voltage")) {
                      setPickerCategory("batteries");
                    } else {
                      setPickerCategory("motors");
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-300 text-xs font-mono border border-slate-700 transition-all shrink-0 flex items-center gap-1"
                >
                  <span>Resolve</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Detailed Rules Table */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white font-mono">
            Deterministic Rule Verification Matrix
          </h3>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            {["ALL", "FAILURES", "FATAL", "CRITICAL", "WARNING", "PASSED"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  filter === cat
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {filteredRules.map((rule) => (
            <div
              key={rule.rule_id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                rule.passed
                  ? "bg-slate-950/40 border-slate-800/80"
                  : rule.severity === "FATAL"
                  ? "bg-rose-950/20 border-rose-500/40"
                  : rule.severity === "CRITICAL"
                  ? "bg-amber-950/20 border-amber-500/40"
                  : "bg-yellow-950/20 border-yellow-500/40"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(rule.severity)}
                  <span className="text-slate-500">{rule.rule_id}</span>
                  <span className="text-slate-400">|</span>
                  <strong className="text-white text-sm">{rule.name}</strong>
                  <span className="text-slate-500 text-[10px]">({rule.category})</span>
                </div>
                <p className="text-slate-300">{rule.message}</p>
                {!rule.passed && (
                  <p className="text-emerald-400 font-semibold">
                    Recommendation: {rule.recommendation}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                {rule.passed ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Validated
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Triggered
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
