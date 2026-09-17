import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Upload, 
  FileText, 
  Sparkles, 
  FolderPlus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MonitoredFile } from '../types';
import { computeSHA256 } from '../utils/crypto';

interface AddFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFile: (file: Omit<MonitoredFile, 'id' | 'status' | 'firstMonitoredTime' | 'lastScanTime'>) => void;
}

export const AddFileModal: React.FC<AddFileModalProps> = ({
  isOpen,
  onClose,
  onAddFile
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'custom' | 'upload' | 'preset'>('preset');
  const [fileName, setFileName] = useState('');
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isImportantConfig, setIsImportantConfig] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    {
      name: 'sshd_config',
      path: '/etc/ssh/sshd_config',
      ext: '.config',
      isConfig: true,
      category: 'config' as const,
      content: `Port 22\nPermitRootLogin no\nPasswordAuthentication no\nX11Forwarding no\nMaxAuthTries 3`
    },
    {
      name: 'auth.log',
      path: '/var/log/auth.log',
      ext: '.log',
      isConfig: false,
      category: 'document' as const,
      content: `Sep 17 08:30:12 server-node sshd[1420]: Accepted publickey for secops from 192.168.1.50 port 54122 ssh2`
    },
    {
      name: 'netcat_probe.sh',
      path: '/usr/local/bin/netcat_probe.sh',
      ext: '.sh',
      isConfig: false,
      category: 'script' as const,
      content: `#!/bin/bash\n# Scheduled port connectivity probe\nnc -zv 127.0.0.1 8080`
    },
    {
      name: 'database.env',
      path: '/opt/webapp/.env',
      ext: '.env',
      isConfig: true,
      category: 'config' as const,
      content: `DB_NAME=cybersecurity_db\nDB_USER=sec_analyst\nDB_PASS=S3cure_Hash_Key_2026\nSECRET_KEY=college_forensic_project`
    }
  ];

  const handleSelectPreset = async (preset: typeof presets[0]) => {
    setIsComputing(true);
    try {
      const hash = await computeSHA256(preset.content);
      onAddFile({
        fileName: preset.name,
        filePath: preset.path,
        fileExtension: preset.ext,
        fileSize: preset.content.length,
        content: preset.content,
        baselineHash: hash,
        currentHash: hash,
        category: preset.category,
        isImportantConfig: preset.isConfig
      });
      onClose();
    } finally {
      setIsComputing(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !filePath.trim()) {
      setErrorMessage('Please provide both file name and path.');
      return;
    }

    setIsComputing(true);
    try {
      const content = fileContent || `# Baseline created for ${fileName}\nTIMESTAMP=${new Date().toISOString()}`;
      const hash = await computeSHA256(content);
      const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';

      onAddFile({
        fileName: fileName.trim(),
        filePath: filePath.trim(),
        fileExtension: ext,
        fileSize: content.length,
        content: content,
        baselineHash: hash,
        currentHash: hash,
        category: isImportantConfig ? 'config' : 'document',
        isImportantConfig
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error computing cryptographic baseline');
    } finally {
      setIsComputing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsComputing(true);
    setErrorMessage('');
    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSHA256(buffer);
      const textPreview = await file.text().catch(() => `[Binary file: ${file.name}, ${file.size} bytes]`);
      const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';

      onAddFile({
        fileName: file.name,
        filePath: `/uploads/${file.name}`,
        fileExtension: ext,
        fileSize: file.size,
        content: textPreview.slice(0, 10000),
        baselineHash: hash,
        currentHash: hash,
        category: ext === '.exe' || ext === '.sh' || ext === '.py' ? 'script' : 'document',
        isImportantConfig: ['.conf', '.ini', '.env', '.json', '.yaml'].includes(ext)
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(`Failed to calculate SHA-256 for uploaded file: ${err.message}`);
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="add-file-modal"
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl my-8 flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Register File for Baseline Monitoring</h3>
              <p className="text-[11px] text-slate-400">Computes cryptographic SHA-256 fingerprint upon registration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-3">
          <button
            onClick={() => setMode('preset')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              mode === 'preset'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Forensic Preset Library
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              mode === 'custom'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom File Path
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              mode === 'upload'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload Local File
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Choose a pre-configured critical system file to add to your college project monitoring scope:
              </p>
              <div className="space-y-2">
                {presets.map((p) => (
                  <div
                    key={p.path}
                    onClick={() => handleSelectPreset(p)}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 flex items-center gap-2">
                        <span>{p.name}</span>
                        {p.isConfig && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans">
                            Config
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{p.path}</div>
                    </div>
                    <button className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-semibold text-slate-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                      + Add Baseline
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="e.g. proxy.conf or sensitive_data.txt"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">File Path</label>
                <input
                  type="text"
                  placeholder="e.g. /etc/proxy/proxy.conf"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Initial Content</label>
                <textarea
                  rows={3}
                  placeholder="Enter initial content to calculate baseline SHA-256 hash..."
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isConfig"
                  checked={isImportantConfig}
                  onChange={(e) => setIsImportantConfig(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-950"
                />
                <label htmlFor="isConfig" className="text-xs text-slate-300 cursor-pointer">
                  Treat as Critical Configuration File (triggers HIGH/CRITICAL alert if changed)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isComputing}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-cyan-500/20"
                >
                  {isComputing ? 'Hashing...' : 'Compute SHA-256 & Register'}
                </button>
              </div>
            </form>
          )}

          {mode === 'upload' && (
            <div className="space-y-4 text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 cursor-pointer transition-colors bg-slate-950/40 space-y-3"
              >
                <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Click to upload a real local file</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Your browser computes the actual SHA-256 cryptographic digest locally via Web Crypto API
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Suitable for any text file, script (.sh/.py), or configuration (.conf/.json/.ini)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
