import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  FilePlus,
  ArrowUpDown
} from 'lucide-react';
import { ActivityLog, FileStatus, AlertLevel } from '../types';
import { truncateHash } from '../utils/crypto';

interface ActivityLogsViewProps {
  logs: ActivityLog[];
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.currentHash && log.currentHash.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Timestamp', 'FileName', 'EventType', 'Status', 'AlertLevel', 'PreviousHash', 'CurrentHash', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.fileName}"`,
      `"${l.eventType}"`,
      `"${l.status}"`,
      `"${l.alertLevel}"`,
      `"${l.previousHash}"`,
      `"${l.currentHash}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fim_forensic_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="activity-logs-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Forensic Activity Audit Logs
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {logs.length} Events
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chronological, tamper-evident security audit entries recorded during baseline generation and integrity scans.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Forensic Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by file, event, details, or hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'SAFE', 'MODIFIED', 'DELETED', 'NEW'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-sans">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Level</th>
                <th className="py-3.5 px-4">Hash Verification</th>
                <th className="py-3.5 px-4">Forensic Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-100">
                      {log.fileName}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        log.status === 'SAFE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        log.status === 'MODIFIED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        log.status === 'DELETED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                        log.alertLevel === 'CRITICAL' ? 'text-rose-400' :
                        log.alertLevel === 'HIGH' ? 'text-orange-400' :
                        log.alertLevel === 'MEDIUM' ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {log.alertLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {log.currentHash && log.currentHash !== 'N/A' && log.currentHash !== 'DELETED' ? (
                        <span title={`SHA-256: ${log.currentHash}`} className="text-slate-400">
                          {truncateHash(log.currentHash, 6, 6)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-[11px] text-slate-300 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No activity logs found.
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
