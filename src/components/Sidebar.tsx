import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Files, 
  AlertTriangle, 
  History, 
  Database, 
  Code2, 
  Play, 
  GraduationCap,
  FileCheck2
} from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'files' 
  | 'alerts' 
  | 'logs' 
  | 'database' 
  | 'code_hub' 
  | 'viva_prep';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openAlertsCount: number;
  onTriggerScan: () => void;
  isScanning: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openAlertsCount,
  onTriggerScan,
  isScanning
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'files', label: 'Monitored Files', icon: <Files className="w-4 h-4" /> },
    { id: 'alerts', label: 'Security Alerts', icon: <AlertTriangle className="w-4 h-4" />, badge: openAlertsCount },
    { id: 'logs', label: 'Activity Logs', icon: <History className="w-4 h-4" /> },
    { id: 'database', label: 'SQLite Database', icon: <Database className="w-4 h-4" /> },
    { id: 'code_hub', label: 'Python Flask Code', icon: <Code2 className="w-4 h-4" /> },
    { id: 'viva_prep', label: 'Viva Prep & Report', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <aside id="sidebar-nav" className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/10">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 tracking-tight leading-snug">FIM System</h1>
            <p className="text-[11px] text-cyan-400 font-mono font-medium">SHA-256 Integrity Engine</p>
          </div>
        </div>
      </div>

      {/* Primary Action: Scan Now */}
      <div className="p-4 border-b border-slate-800/60">
        <button
          id="sidebar-scan-btn"
          onClick={onTriggerScan}
          disabled={isScanning}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            isScanning
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-[0.98]'
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : 'fill-current'}`} />
          <span>{isScanning ? 'Computing SHA-256...' : 'Run Integrity Scan'}</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Monitoring & Forensics
        </div>
        {navItems.slice(0, 4).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          College Project Resources
        </div>
        {navItems.slice(4).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cryptographic Engine</span>
          </span>
          <span className="font-mono text-[10px] text-emerald-400">SHA-256</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Database Store</span>
          <span className="font-mono text-[10px] text-slate-300">SQLite (Local)</span>
        </div>
      </div>
    </aside>
  );
};
