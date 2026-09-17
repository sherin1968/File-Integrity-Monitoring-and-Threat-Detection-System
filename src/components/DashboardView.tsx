import React from 'react';
import { 
  ShieldCheck, 
  FileWarning, 
  FilePlus, 
  Trash2, 
  AlertTriangle, 
  Activity, 
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { MonitoredFile, SecurityAlert, ActivityLog, AlertStatus } from '../types';
import { truncateHash } from '../utils/crypto';

interface DashboardViewProps {
  files: MonitoredFile[];
  alerts: SecurityAlert[];
  logs: ActivityLog[];
  onTriggerScan: () => void;
  isScanning: boolean;
  onNavigateTab: (tab: any) => void;
  onSelectFile: (file: MonitoredFile) => void;
  onUpdateAlertStatus: (alertId: string, status: AlertStatus) => void;
  onSimulateScenario: (scenario: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  files,
  alerts,
  logs,
  onTriggerScan,
  isScanning,
  onNavigateTab,
  onSelectFile,
  onUpdateAlertStatus,
  onSimulateScenario
}) => {
  const totalFiles = files.length;
  const safeFiles = files.filter(f => f.status === 'SAFE').length;
  const modifiedFiles = files.filter(f => f.status === 'MODIFIED').length;
  const newFiles = files.filter(f => f.status === 'NEW').length;
  const deletedFiles = files.filter(f => f.status === 'DELETED').length;

  const totalAlerts = alerts.length;
  const openAlerts = alerts.filter(a => a.status === 'Open').length;
  const criticalAlerts = alerts.filter(a => a.alertLevel === 'CRITICAL').length;
  const highAlerts = alerts.filter(a => a.alertLevel === 'HIGH').length;

  const recentAlerts = [...alerts].slice(0, 5);
  const recentLogs = [...logs].slice(0, 6);

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner with Forensic Context */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                Integrity Engine Online
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Forensic Integrity Overview</h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Continuously validating baseline cryptographic SHA-256 fingerprints across critical operating assets.
              Rule-based heuristics isolate unexpected mutations, deletions, and unmonitored executable injections.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="dashboard-scan-btn"
              onClick={onTriggerScan}
              disabled={isScanning}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                isScanning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95'
              }`}
            >
              <Activity className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Baselines...' : '⚡ Scan All Files Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Monitored */}
        <div 
          onClick={() => onNavigateTab('files')}
          className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:border-slate-700 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monitored</span>
            <FileText className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{totalFiles}</div>
          <p className="text-[11px] text-slate-500 mt-1">Tracked baselines</p>
        </div>

        {/* Safe Files */}
        <div 
          onClick={() => onNavigateTab('files')}
          className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:border-emerald-500/40 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Safe</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{safeFiles}</div>
          <p className="text-[11px] text-emerald-500/80 mt-1">Hashes match baseline</p>
        </div>

        {/* Modified Files */}
        <div 
          onClick={() => onNavigateTab('files')}
          className={`bg-slate-900/80 hover:bg-slate-850 border rounded-xl p-4 cursor-pointer transition-all group ${
            modifiedFiles > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Modified</span>
            <FileWarning className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{modifiedFiles}</div>
          <p className="text-[11px] text-amber-400/80 mt-1">Hash mismatch</p>
        </div>

        {/* New Files */}
        <div 
          onClick={() => onNavigateTab('files')}
          className={`bg-slate-900/80 hover:bg-slate-850 border rounded-xl p-4 cursor-pointer transition-all group ${
            newFiles > 0 ? 'border-purple-500/50 bg-purple-500/5' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">New Files</span>
            <FilePlus className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">{newFiles}</div>
          <p className="text-[11px] text-purple-400/80 mt-1">Unregistered files</p>
        </div>

        {/* Deleted Files */}
        <div 
          onClick={() => onNavigateTab('files')}
          className={`bg-slate-900/80 hover:bg-slate-850 border rounded-xl p-4 cursor-pointer transition-all group ${
            deletedFiles > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Deleted</span>
            <Trash2 className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{deletedFiles}</div>
          <p className="text-[11px] text-red-400/80 mt-1">Missing from disk</p>
        </div>

        {/* Security Alerts */}
        <div 
          onClick={() => onNavigateTab('alerts')}
          className={`bg-slate-900/80 hover:bg-slate-850 border rounded-xl p-4 cursor-pointer transition-all group ${
            openAlerts > 0 ? 'border-rose-500/50 bg-rose-500/5' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{totalAlerts}</div>
          <p className="text-[11px] text-rose-300 font-medium mt-1">{openAlerts} Open triage</p>
        </div>
      </div>

      {/* College Project Viva Demonstration Fast-Track */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Forensic Lab Quick Demonstrations (Viva Practical Tests)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click to inject test tampering and observe SHA-256 detection:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => onSimulateScenario('modify_config')}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-2.5"
          >
            <div className="w-6 h-6 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold">1</div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Modify Critical Config</div>
              <div className="text-[10px] text-slate-400">Alters app.conf (HIGH Alert)</div>
            </div>
          </button>

          <button
            onClick={() => onSimulateScenario('drop_executable')}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-2.5"
          >
            <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold">2</div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Drop New Executable</div>
              <div className="text-[10px] text-slate-400">Injects backdoor.sh (HIGH Alert)</div>
            </div>
          </button>

          <button
            onClick={() => onSimulateScenario('mass_tamper')}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-2.5"
          >
            <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold">3</div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Mass Ransomware Batch</div>
              <div className="text-[10px] text-slate-400">Modifies ≥3 files (CRITICAL Alert)</div>
            </div>
          </button>

          <button
            onClick={() => onSimulateScenario('delete_file')}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-2.5"
          >
            <div className="w-6 h-6 rounded bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold">4</div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Simulate File Deletion</div>
              <div className="text-[10px] text-slate-400">Removes monitored asset (HIGH Alert)</div>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Alerts & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Security Alerts (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-slate-100">Active Security Alerts</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {alerts.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentAlerts.length > 0 ? (
            <div className="space-y-2.5 flex-1">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-slate-850/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        alert.alertLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        alert.alertLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                        alert.alertLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {alert.alertLevel}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{alert.fileName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{alert.alertId}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{alert.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                      <span>Prev: {truncateHash(alert.previousHash, 6, 6)}</span>
                      <span>→</span>
                      <span className="text-amber-300">Curr: {truncateHash(alert.currentHash, 6, 6)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={alert.status}
                      onChange={(e) => onUpdateAlertStatus(alert.alertId, e.target.value as AlertStatus)}
                      className="bg-slate-900 border border-slate-700 text-[11px] rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Open">Open</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <ShieldCheck className="w-10 h-10 text-emerald-500/40 mb-2" />
              <p className="text-xs">No active security alerts recorded.</p>
              <p className="text-[11px] text-slate-600 mt-1">All monitored files match their cryptographic baselines.</p>
            </div>
          )}
        </div>

        {/* Recent Activity Log Stream (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-100">Forensic Audit Trail</h3>
            </div>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>Full Log</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono text-cyan-400">{log.fileName}</span>
                  <span className="font-mono">{log.timestamp}</span>
                </div>
                <div className="font-medium text-slate-300 text-xs flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    log.status === 'SAFE' ? 'bg-emerald-400' :
                    log.status === 'MODIFIED' ? 'bg-amber-400' :
                    log.status === 'DELETED' ? 'bg-red-400' : 'bg-purple-400'
                  }`}></span>
                  <span>{log.eventType}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{log.details}</p>
                {log.currentHash && log.currentHash !== 'N/A' && log.currentHash !== 'DELETED' && (
                  <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                    SHA-256: <span className="text-slate-400">{truncateHash(log.currentHash, 8, 8)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
