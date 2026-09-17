import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Search, 
  ShieldAlert, 
  Filter,
  ArrowUpDown,
  FileCode,
  ShieldQuestion
} from 'lucide-react';
import { SecurityAlert, AlertStatus, AlertLevel } from '../types';
import { truncateHash } from '../utils/crypto';

interface AlertsViewProps {
  alerts: SecurityAlert[];
  onUpdateAlertStatus: (alertId: string, status: AlertStatus) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onUpdateAlertStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = 
      a.alertId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.eventType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === 'ALL' || a.alertLevel === levelFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    return matchesSearch && matchesLevel && matchesStatus;
  });

  return (
    <div id="alerts-view" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          Security Alerts & Threat Triage
          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {alerts.length} Total ({alerts.filter(a => a.status === 'Open').length} Open)
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Rule-based forensic alerts triggered by cryptographic baseline divergence, file removals, or executable drops.
        </p>
      </div>

      {/* Mandatory Forensic Education Banner */}
      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-4.5 flex items-start gap-3.5">
        <ShieldQuestion className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-cyan-300">
            Digital Forensics Distinction: File Integrity Violation vs. Malware
          </span>
          <p className="text-slate-300 leading-relaxed">
            In digital forensics and compliance standards (such as PCI DSS 11.5 and NIST SP 800-53), a <strong>file integrity violation</strong> certifies that cryptographic divergence occurred (i.e. bytes were changed, added, or removed). 
            It does <em>not</em> prove malicious code or active malware. Legitimate system administrators, software updates, and developer patch cycles also cause integrity drift. Each alert below must be triaged to determine if the alteration was authorized or suspicious.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by ID, file, or rule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Severity:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  levelFilter === lvl
                    ? 'bg-slate-700 text-slate-100 border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block"></div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Status:</span>
            {(['ALL', 'Open', 'Investigating', 'Resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Alert ID</th>
                <th className="py-3.5 px-4">Target File</th>
                <th className="py-3.5 px-4">Event & Rule</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Previous SHA-256 / Current SHA-256</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Triage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-cyan-400 font-semibold">
                      {alert.alertId}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-100">{alert.fileName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{alert.filePath}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-medium text-slate-200">{alert.eventType}</div>
                      <p className="text-[11px] text-slate-400 max-w-sm mt-0.5 line-clamp-2">
                        {alert.description}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        alert.alertLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        alert.alertLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                        alert.alertLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {alert.alertLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-400 font-sans text-[10px]">Prev: </span>
                          <span className="text-slate-400" title={alert.previousHash}>
                            {truncateHash(alert.previousHash, 8, 8)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans text-[10px]">Curr: </span>
                          <span className="text-amber-300 font-bold" title={alert.currentHash}>
                            {truncateHash(alert.currentHash, 8, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-sans whitespace-nowrap">
                      {alert.timestamp}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <select
                        value={alert.status}
                        onChange={(e) => onUpdateAlertStatus(alert.alertId, e.target.value as AlertStatus)}
                        className={`text-xs font-medium rounded-md px-2.5 py-1 border transition-colors focus:outline-none ${
                          alert.status === 'Open'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/80 focus:border-rose-500'
                            : alert.status === 'Investigating'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 focus:border-amber-500'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 focus:border-emerald-500'
                        }`}
                      >
                        <option value="Open">Open</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No security alerts found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
