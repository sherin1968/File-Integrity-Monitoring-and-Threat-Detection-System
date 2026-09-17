import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Save, 
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { MonitoredFile } from '../types';
import { formatBytes, computeSHA256 } from '../utils/crypto';

interface FileDetailsModalProps {
  file: MonitoredFile | null;
  onClose: () => void;
  onUpdateFileContent: (fileId: number, newContent: string) => void;
  onRestoreBaseline: (fileId: number) => void;
}

export const FileDetailsModal: React.FC<FileDetailsModalProps> = ({
  file,
  onClose,
  onUpdateFileContent,
  onRestoreBaseline
}) => {
  if (!file) return null;

  const [copiedBaseline, setCopiedBaseline] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editableContent, setEditableContent] = useState(file.content);
  const [liveHash, setLiveHash] = useState(file.currentHash);

  const isHashMatch = file.baselineHash === file.currentHash && file.status !== 'DELETED';

  const copyToClipboard = (text: string, type: 'baseline' | 'current') => {
    navigator.clipboard.writeText(text);
    if (type === 'baseline') {
      setCopiedBaseline(true);
      setTimeout(() => setCopiedBaseline(false), 2000);
    } else {
      setCopiedCurrent(true);
      setTimeout(() => setCopiedCurrent(false), 2000);
    }
  };

  const handleContentChange = async (val: string) => {
    setEditableContent(val);
    const newHash = await computeSHA256(val);
    setLiveHash(newHash);
  };

  const handleSaveSimulatedChange = () => {
    onUpdateFileContent(file.id, editableContent);
    setIsEditingContent(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="file-details-modal"
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{file.fileName}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                  file.status === 'SAFE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  file.status === 'MODIFIED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  file.status === 'DELETED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {file.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-lg">{file.filePath}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Extension</span>
              <span className="text-sm font-mono font-bold text-slate-200">{file.fileExtension || 'None'}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">File Size</span>
              <span className="text-sm font-mono font-bold text-slate-200">{formatBytes(file.fileSize)}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">First Monitored</span>
              <span className="text-xs font-mono text-slate-300">{file.firstMonitoredTime}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Last Scan Time</span>
              <span className="text-xs font-mono text-slate-300">{file.lastScanTime}</span>
            </div>
          </div>

          {/* Cryptographic Hash Comparison Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Cryptographic SHA-256 Digest Verification
                </h4>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                {isHashMatch ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> HASHLOCK MATCH (SAFE)
                  </span>
                ) : file.status === 'DELETED' ? (
                  <span className="text-red-400 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> FILE MISSING FROM DISK
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> HASH MISMATCH (MODIFIED)
                  </span>
                )}
              </div>
            </div>

            {/* Baseline Hash Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Baseline Hash (Stored Reference Digest):</span>
                <button
                  onClick={() => copyToClipboard(file.baselineHash, 'baseline')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedBaseline ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBaseline ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 break-all select-all">
                {file.baselineHash}
              </div>
            </div>

            {/* Current Hash Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Current Hash (Calculated from file data):</span>
                <button
                  onClick={() => copyToClipboard(file.currentHash, 'current')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedCurrent ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurrent ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className={`p-3 bg-slate-900 border rounded-lg font-mono text-xs break-all select-all ${
                isHashMatch 
                  ? 'border-slate-800 text-emerald-400' 
                  : 'border-amber-500/50 text-amber-300'
              }`}>
                {file.currentHash}
              </div>
            </div>

            {/* Educational Forensic Insight */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cryptographic Forensic Property (The Avalanche Effect)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                SHA-256 (Secure Hash Algorithm 256-bit) is a one-way cryptographic hash function. Changing even a single bit or whitespace in this file causes approximately 50% of the output hexadecimal characters to change unpredictably. This guarantees mathematical integrity without storing the full file contents.
              </p>
            </div>
          </div>

          {/* Interactive Safe Modification Simulator for Viva / College Lab */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Interactive File Content & Hash Simulator
                </h4>
                <p className="text-[11px] text-slate-400">
                  Safely modify the simulated file content to demonstrate real-time cryptographic hash recalculation to your professor or examiner.
                </p>
              </div>

              {!isEditingContent ? (
                <button
                  onClick={() => setIsEditingContent(true)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  Edit Content
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsEditingContent(false); setEditableContent(file.content); }}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-xs hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSimulatedChange}
                    className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save & Test
                  </button>
                </div>
              )}
            </div>

            {isEditingContent ? (
              <div className="space-y-2">
                <textarea
                  value={editableContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                />
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Live Computed SHA-256:</span>
                  <span className="text-cyan-400 font-bold">{liveHash}</span>
                </div>
              </div>
            ) : (
              <pre className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-32">
                {file.content}
              </pre>
            )}

            {/* Remediation Action */}
            {!isHashMatch && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-amber-400">File is currently marked as modified.</span>
                <button
                  onClick={() => onRestoreBaseline(file.id)}
                  className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Original Baseline Content</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
