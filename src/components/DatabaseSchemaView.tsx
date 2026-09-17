import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Key, 
  Copy, 
  Check, 
  FileCode2, 
  Layers, 
  Download 
} from 'lucide-react';
import { MonitoredFile, SecurityAlert, ActivityLog } from '../types';

interface DatabaseSchemaViewProps {
  files: MonitoredFile[];
  alerts: SecurityAlert[];
  logs: ActivityLog[];
}

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({
  files,
  alerts,
  logs
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTable, setActiveTable] = useState<'monitored_files' | 'file_hashes' | 'alerts' | 'activity_logs'>('monitored_files');

  const sqlSchema = `-- SQLite Database Schema for File Integrity Monitoring & Threat Detection System
-- File: security.db

PRAGMA foreign_keys = ON;

-- 1. Monitored Files Table
CREATE TABLE IF NOT EXISTS monitored_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_path TEXT UNIQUE NOT NULL,
    file_extension TEXT,
    file_size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'SAFE', -- SAFE, MODIFIED, DELETED, NEW
    first_monitored_time TEXT NOT NULL,
    last_scan_time TEXT,
    is_active INTEGER DEFAULT 1
);

-- 2. File Hashes Table (Baseline and Current SHA-256)
CREATE TABLE IF NOT EXISTS file_hashes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    baseline_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (file_id) REFERENCES monitored_files (id) ON DELETE CASCADE
);

-- 3. Security Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT UNIQUE NOT NULL,
    file_id INTEGER,
    file_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    alert_level TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    previous_hash TEXT,
    current_hash TEXT,
    timestamp TEXT NOT NULL,
    status TEXT DEFAULT 'Open', -- Open, Investigating, Resolved
    description TEXT,
    FOREIGN KEY (file_id) REFERENCES monitored_files (id) ON DELETE SET NULL
);

-- 4. Forensic Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    file_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    previous_hash TEXT,
    current_hash TEXT,
    status TEXT NOT NULL,
    alert_level TEXT NOT NULL,
    details TEXT
);

-- Indices for rapid query lookups during scans
CREATE INDEX IF NOT EXISTS idx_files_path ON monitored_files(file_path);
CREATE INDEX IF NOT EXISTS idx_hashes_file_id ON file_hashes(file_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON activity_logs(timestamp);
`;

  const copySQL = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tableDefinitions = [
    {
      id: 'monitored_files' as const,
      name: 'monitored_files',
      count: files.length,
      description: 'Primary registry of all monitored operating system files, config files, and paths.',
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY AUTOINCREMENT', desc: 'Unique identifier' },
        { name: 'file_name', type: 'TEXT', constraint: 'NOT NULL', desc: 'File base name (e.g. app.conf)' },
        { name: 'file_path', type: 'TEXT', constraint: 'UNIQUE NOT NULL', desc: 'Absolute path on filesystem' },
        { name: 'file_extension', type: 'TEXT', constraint: '', desc: 'Extension (.conf, .py, .sh)' },
        { name: 'file_size', type: 'INTEGER', constraint: 'DEFAULT 0', desc: 'File size in bytes' },
        { name: 'status', type: 'TEXT', constraint: "DEFAULT 'SAFE'", desc: 'SAFE, MODIFIED, DELETED, NEW' },
        { name: 'first_monitored_time', type: 'TEXT', constraint: 'NOT NULL', desc: 'Initial registration timestamp' },
        { name: 'last_scan_time', type: 'TEXT', constraint: '', desc: 'Last time SHA-256 was recalculated' },
        { name: 'is_active', type: 'INTEGER', constraint: 'DEFAULT 1', desc: '1=Active, 0=Deactivated' },
      ]
    },
    {
      id: 'file_hashes' as const,
      name: 'file_hashes',
      count: files.length,
      description: 'Stores the authoritative baseline SHA-256 hash alongside the latest scan hash.',
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY AUTOINCREMENT', desc: 'Record ID' },
        { name: 'file_id', type: 'INTEGER', constraint: 'FK -> monitored_files(id)', desc: 'Associated file ID' },
        { name: 'baseline_hash', type: 'TEXT', constraint: 'NOT NULL', desc: '64-char hex SHA-256 reference' },
        { name: 'current_hash', type: 'TEXT', constraint: 'NOT NULL', desc: 'Latest computed SHA-256 digest' },
        { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL', desc: 'Timestamp of last hash refresh' },
      ]
    },
    {
      id: 'alerts' as const,
      name: 'alerts',
      count: alerts.length,
      description: 'Security incident records generated by the rule-based threat engine.',
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY AUTOINCREMENT', desc: 'Record ID' },
        { name: 'alert_id', type: 'TEXT', constraint: 'UNIQUE NOT NULL', desc: 'e.g. ALT-2026-001' },
        { name: 'file_id', type: 'INTEGER', constraint: 'FK -> monitored_files(id)', desc: 'Target file link' },
        { name: 'file_name', type: 'TEXT', constraint: 'NOT NULL', desc: 'Target filename' },
        { name: 'event_type', type: 'TEXT', constraint: 'NOT NULL', desc: 'Modification / Deletion / Injection' },
        { name: 'alert_level', type: 'TEXT', constraint: 'NOT NULL', desc: 'LOW, MEDIUM, HIGH, CRITICAL' },
        { name: 'previous_hash', type: 'TEXT', constraint: '', desc: 'Baseline SHA-256' },
        { name: 'current_hash', type: 'TEXT', constraint: '', desc: 'Tampered SHA-256' },
        { name: 'timestamp', type: 'TEXT', constraint: 'NOT NULL', desc: 'Alert creation time' },
        { name: 'status', type: 'TEXT', constraint: "DEFAULT 'Open'", desc: 'Open, Investigating, Resolved' },
        { name: 'description', type: 'TEXT', constraint: '', desc: 'Forensic finding note' },
      ]
    },
    {
      id: 'activity_logs' as const,
      name: 'activity_logs',
      count: logs.length,
      description: 'Immutable chronological audit trail recording all scanning events.',
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY AUTOINCREMENT', desc: 'Log ID' },
        { name: 'timestamp', type: 'TEXT', constraint: 'NOT NULL', desc: 'Event timestamp' },
        { name: 'file_name', type: 'TEXT', constraint: 'NOT NULL', desc: 'File or System Scan' },
        { name: 'event_type', type: 'TEXT', constraint: 'NOT NULL', desc: 'Event action code' },
        { name: 'previous_hash', type: 'TEXT', constraint: '', desc: 'Previous SHA-256' },
        { name: 'current_hash', type: 'TEXT', constraint: '', desc: 'Current SHA-256' },
        { name: 'status', type: 'TEXT', constraint: 'NOT NULL', desc: 'SAFE, MODIFIED, DELETED, NEW' },
        { name: 'alert_level', type: 'TEXT', constraint: 'NOT NULL', desc: 'LOW, MEDIUM, HIGH, CRITICAL' },
        { name: 'details', type: 'TEXT', constraint: '', desc: 'Detailed log message' },
      ]
    }
  ];

  const currentTable = tableDefinitions.find(t => t.id === activeTable)!;

  return (
    <div id="database-schema-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            SQLite Database Architecture
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              database/security.db
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Normalized SQLite schema with foreign key integrity, audit indexing, and cryptographic hash storage.
          </p>
        </div>

        <button
          onClick={copySQL}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{copied ? 'Copied SQL DDL!' : 'Copy SQL Schema'}</span>
        </button>
      </div>

      {/* Table Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tableDefinitions.map((tbl) => (
          <div
            key={tbl.id}
            onClick={() => setActiveTable(tbl.id)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTable === tbl.id
                ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono font-bold text-slate-200">{tbl.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400">
                {tbl.count} rows
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">{tbl.description}</p>
          </div>
        ))}
      </div>

      {/* Selected Table Schema Details */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono font-bold text-sm text-slate-200">{currentTable.name}</h3>
          </div>
          <span className="text-xs text-slate-400">{currentTable.description}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-sans">
              <tr>
                <th className="py-3 px-4">Column Name</th>
                <th className="py-3 px-4">Data Type</th>
                <th className="py-3 px-4">Constraints</th>
                <th className="py-3 px-4">Description / Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {currentTable.columns.map((col) => (
                <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-100 flex items-center gap-1.5">
                    {col.constraint.includes('PRIMARY KEY') && (
                      <Key className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                    <span>{col.name}</span>
                  </td>
                  <td className="py-2.5 px-4 text-cyan-400 font-semibold">{col.type}</td>
                  <td className="py-2.5 px-4 text-amber-300/90 text-[11px]">{col.constraint || '—'}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px]">{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw SQL DDL Code View */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-300">schema.sql (Complete SQLite Definition)</span>
          </div>
          <button
            onClick={copySQL}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-72">
          {sqlSchema}
        </pre>
      </div>
    </div>
  );
};
