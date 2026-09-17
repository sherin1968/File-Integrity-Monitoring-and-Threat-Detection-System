import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  ShieldAlert, 
  X, 
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { ScanTelemetry } from '../types';

interface ScanModalProps {
  isOpen: boolean;
  isScanning: boolean;
  telemetry: ScanTelemetry | null;
  onClose: () => void;
  onViewAlerts: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  isScanning,
  telemetry,
  onClose,
  onViewAlerts
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        id="scan-telemetry-modal"
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isScanning ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isScanning ? <Activity className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {isScanning ? 'Running Cryptographic Integrity Scan' : 'Scan Completed'}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {isScanning ? 'Comparing current SHA-256 against baseline digests...' : `Finished in ${telemetry?.elapsedMs || 120}ms`}
              </p>
            </div>
          </div>
          {!isScanning && (
            <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isScanning ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Hashing File Blocks (256-bit digest)...</p>
                <p className="text-[11px] text-slate-500 mt-1">Executing rule-based threat evaluation heuristics</p>
              </div>
            </div>
          ) : (
            <>
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-4 gap-2.5 text-center">
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Scanned</span>
                  <span className="text-lg font-bold font-mono text-slate-100">{telemetry?.totalScanned ?? 0}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-emerald-400 block font-semibold">Safe (Intact)</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{telemetry?.safeCount ?? 0}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-amber-400 block font-semibold">Modified</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{telemetry?.modifiedCount ?? 0}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-red-400 block font-semibold">Deleted</span>
                  <span className="text-lg font-bold font-mono text-red-400">{telemetry?.deletedCount ?? 0}</span>
                </div>
              </div>

              {/* Alert Verdict */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                (telemetry?.alertsGenerated ?? 0) > 0
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              }`}>
                {(telemetry?.alertsGenerated ?? 0) > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold">
                    {(telemetry?.alertsGenerated ?? 0) > 0
                      ? `Integrity Divergence Detected: ${telemetry?.alertsGenerated} Alert(s) Triggered`
                      : 'Integrity Verification Passed (100% Match)'}
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {(telemetry?.alertsGenerated ?? 0) > 0
                      ? 'One or more files diverged from their baseline hash. Threat detection rules evaluated severity. Remember: file integrity violation requires triage before confirming threat intent.'
                      : 'All monitored files matched their recorded cryptographic fingerprints bit-for-bit.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isScanning && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">{telemetry?.timestamp}</span>
            <div className="flex items-center gap-2">
              {(telemetry?.alertsGenerated ?? 0) > 0 && (
                <button
                  onClick={onViewAlerts}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Review Alerts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
