export type FileStatus = 'SAFE' | 'MODIFIED' | 'DELETED' | 'NEW';

export type AlertLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'Open' | 'Investigating' | 'Resolved';

export interface MonitoredFile {
  id: number;
  fileName: string;
  filePath: string;
  fileExtension: string;
  fileSize: number; // in bytes
  content: string; // simulated file content for cryptographic hashing
  baselineHash: string;
  currentHash: string;
  status: FileStatus;
  firstMonitoredTime: string;
  lastScanTime: string;
  category: 'config' | 'executable' | 'script' | 'document' | 'database';
  isImportantConfig?: boolean;
}

export interface SecurityAlert {
  id: number;
  alertId: string;
  fileId?: number;
  fileName: string;
  filePath: string;
  eventType: string;
  alertLevel: AlertLevel;
  previousHash: string;
  currentHash: string;
  timestamp: string;
  status: AlertStatus;
  description: string;
  forensicDistinction: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  fileName: string;
  eventType: string;
  previousHash: string;
  currentHash: string;
  status: FileStatus;
  alertLevel: AlertLevel;
  details: string;
}

export interface ScanTelemetry {
  timestamp: string;
  totalScanned: number;
  safeCount: number;
  modifiedCount: number;
  deletedCount: number;
  newCount: number;
  alertsGenerated: number;
  elapsedMs: number;
}
