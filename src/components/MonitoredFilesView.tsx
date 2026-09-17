import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  FolderSearch, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Eye,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { MonitoredFile, FileStatus } from '../types';
import { truncateHash, formatBytes } from '../utils/crypto';

interface MonitoredFilesViewProps {
  files: MonitoredFile[];
  onSelectFile: (file: MonitoredFile) => void;
  onOpenAddModal: () => void;
  onSimulateEdit: (fileId: number) => void;
  onDeleteFile: (fileId: number) => void;
  onRestoreBaseline: (fileId: number) => void;
  onSelectFolderToMonitor: () => void;
}

export const MonitoredFilesView: React.FC<MonitoredFilesViewProps> = ({
  files,
  onSelectFile,
  onOpenAddModal,
  onSimulateEdit,
  onDeleteFile,
  onRestoreBaseline,
  onSelectFolderToMonitor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredFiles = files.filter(f => {
    const matchesSearch = 
      f.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.baselineHash.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && f.status === statusFilter;
  });

  return (
    <div id="monitored-files-view" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Monitored Files Repository
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {files.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered baseline cryptographic fingerprints for operating system files, services, and web configurations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onSelectFolderToMonitor}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FolderSearch className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Folder to Monitor</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add File</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by file name, path, or SHA-256..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'SAFE', 'MODIFIED', 'DELETED', 'NEW'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">File Path</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Baseline SHA-256</th>
                <th className="py-3.5 px-4">Last Scanned</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => {
                  const isSafe = file.status === 'SAFE';
                  const isModified = file.status === 'MODIFIED';
                  const isDeleted = file.status === 'DELETED';
                  const isNew = file.status === 'NEW';

                  return (
                    <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                          <button
                            onClick={() => onSelectFile(file)}
                            className="hover:text-cyan-400 hover:underline text-left font-semibold"
                          >
                            {file.fileName}
                          </button>
                          {file.isImportantConfig && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans">
                              Config
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isSafe ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          isModified ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                          isDeleted ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {isSafe && <CheckCircle2 className="w-3 h-3" />}
                          {isModified && <AlertTriangle className="w-3 h-3" />}
                          {isDeleted && <Trash2 className="w-3 h-3" />}
                          {file.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={file.filePath}>
                        {file.filePath}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        {formatBytes(file.fileSize)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-400" title={file.baselineHash}>
                          {truncateHash(file.baselineHash, 8, 8)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                        {file.lastScanTime}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Inspect Details & Hashes"
                            onClick={() => onSelectFile(file)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Safe Test Edit: for viva / lab testing */}
                          <button
                            title="Simulate Content Modification"
                            onClick={() => onSimulateEdit(file.id)}
                            className="p-1.5 rounded hover:bg-slate-700 text-amber-400 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Restore Baseline button if modified or deleted */}
                          {(isModified || isDeleted) && (
                            <button
                              title="Restore Baseline Content"
                              onClick={() => onRestoreBaseline(file.id)}
                              className="p-1.5 rounded hover:bg-slate-700 text-emerald-400 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete File */}
                          <button
                            title="Simulate File Deletion"
                            onClick={() => onDeleteFile(file.id)}
                            className="p-1.5 rounded hover:bg-slate-700 text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No files found matching your criteria.
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
