import { MonitoredFile, SecurityAlert, ActivityLog } from '../types';

export const INITIAL_FILES: Omit<MonitoredFile, 'baselineHash' | 'currentHash'>[] = [
  {
    id: 1,
    fileName: 'app.conf',
    filePath: '/etc/fim_test/app.conf',
    fileExtension: '.conf',
    fileSize: 184,
    content: `# Web Application Production Configuration\nSERVER_PORT=8080\nDEBUG=False\nDATABASE_URL=sqlite:///database/security.db\nSESSION_TIMEOUT=900\nALLOWED_HOSTS=localhost,127.0.0.1`,
    status: 'SAFE',
    firstMonitoredTime: '2026-09-17 08:30:00',
    lastScanTime: '2026-09-17 09:15:00',
    category: 'config',
    isImportantConfig: true
  },
  {
    id: 2,
    fileName: 'sys_auth.py',
    filePath: '/usr/local/bin/sys_auth.py',
    fileExtension: '.py',
    fileSize: 312,
    content: `#!/usr/bin/env python3\n# Authenticator Core Daemon\nimport os, sys\n\ndef verify_token(user, token):\n    # Enforce constant time comparison\n    return len(token) == 64\n\nif __name__ == '__main__':\n    print("[+] Auth daemon online.")`,
    status: 'SAFE',
    firstMonitoredTime: '2026-09-17 08:32:00',
    lastScanTime: '2026-09-17 09:15:00',
    category: 'script',
    isImportantConfig: false
  },
  {
    id: 3,
    fileName: 'server_firewall.ini',
    filePath: '/etc/firewall/server_firewall.ini',
    fileExtension: '.ini',
    fileSize: 240,
    content: `[InboundRules]\nPort_22 = ALLOW_LOCAL_SUBNET\nPort_80 = REDIRECT_HTTPS\nPort_443 = ALLOW_ANY\nPort_5000 = REJECT_EXTERNAL\nDefaultPolicy = DROP`,
    status: 'SAFE',
    firstMonitoredTime: '2026-09-17 08:35:00',
    lastScanTime: '2026-09-17 09:15:00',
    category: 'config',
    isImportantConfig: true
  },
  {
    id: 4,
    fileName: 'database_backup.sql',
    filePath: '/var/backups/database_backup.sql',
    fileExtension: '.sql',
    fileSize: 520,
    content: `-- PostgreSQL Security Schema Snapshot\nCREATE TABLE audit_trail (\n    id SERIAL PRIMARY KEY,\n    event_type VARCHAR(64) NOT NULL,\n    sha256_digest CHAR(64) NOT NULL,\n    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);`,
    status: 'SAFE',
    firstMonitoredTime: '2026-09-17 08:40:00',
    lastScanTime: '2026-09-17 09:15:00',
    category: 'database',
    isImportantConfig: false
  },
  {
    id: 5,
    fileName: 'security_policy.txt',
    filePath: '/opt/docs/security_policy.txt',
    fileExtension: '.txt',
    fileSize: 410,
    content: `CYBERSECURITY STANDARD OPERATING PROCEDURE (SOP-401)\n1. All production configuration files are bound to cryptographic SHA-256 baselines.\n2. Integrity drift triggers real-time forensic alerts.\n3. Digital Forensics team must classify whether changes represent legitimate patches or tampering.`,
    status: 'SAFE',
    firstMonitoredTime: '2026-09-17 08:45:00',
    lastScanTime: '2026-09-17 09:15:00',
    category: 'document',
    isImportantConfig: false
  }
];

export const INITIAL_ALERTS: SecurityAlert[] = [
  {
    id: 1,
    alertId: 'ALT-2026-001',
    fileId: 1,
    fileName: 'app.conf',
    filePath: '/etc/fim_test/app.conf',
    eventType: 'Baseline Registration',
    alertLevel: 'LOW',
    previousHash: 'N/A (Initial)',
    currentHash: '38a1a45749f7e81dfbbd210b37df49e0f63b27b38d6df72e2729959f67a21f7c',
    timestamp: '2026-09-17 08:30:00',
    status: 'Resolved',
    description: 'Initial cryptographic SHA-256 baseline established for production configuration file.',
    forensicDistinction: 'Baseline establishment event. No threat indicated.'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 1,
    timestamp: '2026-09-17 08:30:00',
    fileName: 'app.conf',
    eventType: 'BASELINE_ESTABLISHED',
    previousHash: 'N/A',
    currentHash: '38a1a45749f7e81dfbbd210b37df49e0f63b27b38d6df72e2729959f67a21f7c',
    status: 'SAFE',
    alertLevel: 'LOW',
    details: 'Initial SHA-256 fingerprint generated and committed to SQLite baseline repository.'
  },
  {
    id: 2,
    timestamp: '2026-09-17 08:32:00',
    fileName: 'sys_auth.py',
    eventType: 'BASELINE_ESTABLISHED',
    previousHash: 'N/A',
    currentHash: '7c4e5b9f8d1a2c3b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d',
    status: 'SAFE',
    alertLevel: 'LOW',
    details: 'Executable Python module registered for SHA-256 continuous integrity inspection.'
  },
  {
    id: 3,
    timestamp: '2026-09-17 09:15:00',
    fileName: 'System Scan',
    eventType: 'SCHEDULED_INTEGRITY_SCAN',
    previousHash: 'N/A',
    currentHash: 'N/A',
    status: 'SAFE',
    alertLevel: 'LOW',
    details: 'Full integrity scan executed. 5/5 files intact against recorded baseline digests.'
  }
];
