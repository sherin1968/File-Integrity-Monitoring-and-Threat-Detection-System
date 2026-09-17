import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  FlaskConical, 
  RotateCcw, 
  FileWarning, 
  Terminal, 
  FileCheck2,
  Trash2
} from 'lucide-react';

interface HeaderProps {
  onTriggerScan: () => void;
  isScanning: boolean;
  onOpenAddModal: () => void;
  onSimulateScenario: (scenario: string) => void;
  onResetBaseline: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onTriggerScan,
  isScanning,
  onOpenAddModal,
  onSimulateScenario,
  onResetBaseline
}) => {
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  return (
    <header id="top-header" className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            File Integrity Monitoring & Threat Detection System
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              SHA-256 Baseline Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400">Digital Forensics & Incident Response (DFIR) Laboratory</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Lab Scenarios Dropdown for College Demonstrations */}
        <div className="relative">
          <button
            id="scenarios-dropdown-btn"
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>Demonstration Scenarios</span>
          </button>

          {showScenarioMenu && (
            <div 
              id="scenarios-menu"
              className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-xl shadow-black/50 p-2 z-50 text-xs"
              onMouseLeave={() => setShowScenarioMenu(false)}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                College Lab Scenarios
              </div>
              <button
                onClick={() => { onSimulateScenario('modify_config'); setShowScenarioMenu(false); }}
                className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 text-slate-300 flex items-center gap-2"
              >
                <FileWarning className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-semibold text-rose-300">1. Modify Critical Config</div>
                  <div className="text-[10px] text-slate-400">Changes port in app.conf (HIGH alert)</div>
                </div>
              </button>

              <button
                onClick={() => { onSimulateScenario('drop_executable'); setShowScenarioMenu(false); }}
                className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 text-slate-300 flex items-center gap-2"
              >
                <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-amber-300">2. Drop Suspicious Executable</div>
                  <div className="text-[10px] text-slate-400">Adds unmonitored backdoor.sh (HIGH alert)</div>
                </div>
              </button>

              <button
                onClick={() => { onSimulateScenario('mass_tamper'); setShowScenarioMenu(false); }}
                className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 text-slate-300 flex items-center gap-2"
              >
                <FileWarning className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-purple-300">3. Mass File Tampering</div>
                  <div className="text-[10px] text-slate-400">Modifies ≥3 files at once (CRITICAL alert)</div>
                </div>
              </button>

              <button
                onClick={() => { onSimulateScenario('delete_file'); setShowScenarioMenu(false); }}
                className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 text-slate-300 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <div className="font-semibold text-red-300">4. Delete Monitored File</div>
                  <div className="text-[10px] text-slate-400">Simulates file deletion/scrubbing (HIGH alert)</div>
                </div>
              </button>

              <div className="border-t border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => { onResetBaseline(); setShowScenarioMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-emerald-400 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="font-medium">Reset All to Safe Baseline</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add File to Monitor Button */}
        <button
          id="header-add-file-btn"
          onClick={onOpenAddModal}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Add File</span>
        </button>

        {/* Quick Scan Now Button */}
        <button
          id="header-scan-btn"
          onClick={onTriggerScan}
          disabled={isScanning}
          className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
            isScanning 
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/20'
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : 'fill-current'}`} />
          <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
        </button>
      </div>
    </header>
  );
};
