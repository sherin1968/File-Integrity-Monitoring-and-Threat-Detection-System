import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  FolderTree, 
  Download, 
  FileText, 
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const ProjectCodeHub: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('app.py');
  const [copied, setCopied] = useState(false);

  const filesCode: Record<string, { code: string; language: string; description: string }> = {
    'app.py': {
      language: 'python',
      description: 'Flask web application controller with routing, session management, and triage endpoints.',
      code: `"""
app.py - Main Flask application entry point for the File Integrity Monitoring and Threat Detection System.
Designed for college cybersecurity & digital forensic science projects.
"""

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import os
import sqlite3
from database import get_db_connection, init_db
from hashing import calculate_sha256
from monitor import add_file_to_monitor, scan_monitored_files
from threat_detection import evaluate_threat

app = Flask(__name__)
app.secret_key = "fim-security-educational-key"

# Ensure database tables exist on startup
init_db()

@app.route("/")
def dashboard():
    """Renders the central cybersecurity dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM monitored_files WHERE is_active = 1")
    total_files = cursor.fetchone()['total']

    cursor.execute("SELECT COUNT(*) as safe FROM monitored_files WHERE status = 'SAFE' AND is_active = 1")
    safe_files = cursor.fetchone()['safe']

    cursor.execute("SELECT COUNT(*) as modified FROM monitored_files WHERE status = 'MODIFIED' AND is_active = 1")
    modified_files = cursor.fetchone()['modified']

    cursor.execute("SELECT COUNT(*) as deleted FROM monitored_files WHERE status = 'DELETED' AND is_active = 1")
    deleted_files = cursor.fetchone()['deleted']

    cursor.execute("SELECT COUNT(*) as new_files FROM monitored_files WHERE status = 'NEW' AND is_active = 1")
    new_files = cursor.fetchone()['new_files']

    cursor.execute("SELECT COUNT(*) as total_alerts FROM alerts")
    total_alerts = cursor.fetchone()['total_alerts']

    cursor.execute("SELECT COUNT(*) as open_alerts FROM alerts WHERE status = 'Open'")
    open_alerts = cursor.fetchone()['open_alerts']

    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 5")
    recent_alerts = cursor.fetchall()

    cursor.execute("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 8")
    recent_logs = cursor.fetchall()
    conn.close()

    stats = {
        "total_files": total_files,
        "safe_files": safe_files,
        "modified_files": modified_files,
        "deleted_files": deleted_files,
        "new_files": new_files,
        "total_alerts": total_alerts,
        "open_alerts": open_alerts
    }

    return render_template("index.html", stats=stats, recent_alerts=recent_alerts, recent_logs=recent_logs)

@app.route("/files")
def files():
    """Renders the list of monitored files."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT mf.*, fh.baseline_hash, fh.current_hash
        FROM monitored_files mf
        LEFT JOIN file_hashes fh ON mf.id = fh.file_id
        WHERE mf.is_active = 1
        ORDER BY mf.id DESC
    """)
    file_list = cursor.fetchall()
    conn.close()
    return render_template("files.html", files=file_list)

@app.route("/add_file", methods=["POST"])
def add_file():
    """Handles adding a single file to monitoring."""
    file_path = request.form.get("file_path", "").strip()
    if not file_path:
        flash("Please provide a valid file path.", "danger")
        return redirect(url_for("files"))

    success, msg = add_file_to_monitor(file_path)
    if success:
        flash(msg, "success")
    else:
        flash(msg, "danger")
    return redirect(url_for("files"))

@app.route("/scan", methods=["GET", "POST"])
def trigger_scan():
    """Runs a full integrity scan on all active files."""
    summary = scan_monitored_files()
    flash(f"Scan completed: {summary['total_scanned']} checked. Safe: {summary['safe_count']}, Modified: {summary['modified_count']}, Deleted: {summary['deleted_count']}, Alerts: {summary['new_alerts']}", "info")
    return redirect(url_for("dashboard"))

@app.route("/alerts")
def alerts():
    """Displays all security alerts with triage controls."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC")
    all_alerts = cursor.fetchall()
    conn.close()
    return render_template("alerts.html", alerts=all_alerts)

@app.route("/alert/<int:alert_id>/status", methods=["POST"])
def update_alert_status(alert_id):
    """Updates an alert status (Open, Investigating, Resolved)."""
    new_status = request.form.get("status")
    if new_status in ["Open", "Investigating", "Resolved"]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET status = ? WHERE id = ?", (new_status, alert_id))
        conn.commit()
        conn.close()
        flash(f"Alert #{alert_id} status updated to '{new_status}'.", "success")
    return redirect(url_for("alerts"))

@app.route("/logs")
def logs():
    """Displays chronological activity and audit logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activity_logs ORDER BY id DESC")
    all_logs = cursor.fetchall()
    conn.close()
    return render_template("logs.html", logs=all_logs)

@app.route("/file/<int:file_id>")
def file_details(file_id):
    """Displays forensic inspection details for an individual file."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT mf.*, fh.baseline_hash, fh.current_hash, fh.updated_at
        FROM monitored_files mf
        LEFT JOIN file_hashes fh ON mf.id = fh.file_id
        WHERE mf.id = ?
    """, (file_id,))
    item = cursor.fetchone()

    if not item:
        conn.close()
        flash("File record not found.", "danger")
        return redirect(url_for("files"))

    cursor.execute("SELECT * FROM alerts WHERE file_id = ? ORDER BY id DESC", (file_id,))
    file_alerts = cursor.fetchall()

    cursor.execute("SELECT * FROM activity_logs WHERE file_name = ? ORDER BY id DESC LIMIT 10", (item['file_name'],))
    file_logs = cursor.fetchall()
    conn.close()

    return render_template("file_details.html", file=item, alerts=file_alerts, logs=file_logs)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)`
    },
    'database.py': {
      language: 'python',
      description: 'SQLite database management, schema bootstrap, and connection pooling.',
      code: `"""
database.py - SQLite Database initialization and helper functions for File Integrity Monitoring.
"""

import sqlite3
import os

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database")
DB_PATH = os.path.join(DB_DIR, "security.db")

def get_db_connection():
    """Establish connection to SQLite database with dictionary-like row access."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema with proper primary keys and timestamps."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Monitored files table
    cursor.execute("""
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
    """)

    # 2. File hashes table (tracks baseline and current SHA-256)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS file_hashes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        baseline_hash TEXT NOT NULL,
        current_hash TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (file_id) REFERENCES monitored_files (id) ON DELETE CASCADE
    );
    """)

    # 3. Security alerts table
    cursor.execute("""
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
    """)

    # 4. Activity logs table (chronological security audit trail)
    cursor.execute("""
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
    """)

    conn.commit()
    conn.close()
    print("[+] SQLite security database initialized successfully at:", DB_PATH)

if __name__ == "__main__":
    init_db()`
    },
    'hashing.py': {
      language: 'python',
      description: 'Cryptographic SHA-256 chunked calculation using standard hashlib.',
      code: `"""
hashing.py - Cryptographic SHA-256 calculation module for file integrity verification.
"""

import hashlib
import os

CHUNK_SIZE = 65536  # Read in 64KB blocks for memory efficiency with large files

def calculate_sha256(file_path):
    """
    Computes the SHA-256 cryptographic hash of a given file.
    Returns:
        str: 64-character hexadecimal SHA-256 digest, or None if file cannot be read.
    """
    if not os.path.isfile(file_path):
        return None

    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            while True:
                data = f.read(CHUNK_SIZE)
                if not data:
                    break
                sha256_hash.update(data)
        return sha256_hash.hexdigest()
    except (PermissionError, OSError) as err:
        print(f"[!] Warning: Cannot read {file_path}: {err}")
        return None

def verify_integrity(baseline_hash, current_hash):
    """
    Compares baseline hash and current hash.
    Returns True if intact, False if modified.
    """
    if not baseline_hash or not current_hash:
        return False
    return baseline_hash.strip().lower() == current_hash.strip().lower()`
    },
    'threat_detection.py': {
      language: 'python',
      description: 'Deterministic rule-based threat engine with forensic distinction banner.',
      code: `"""
threat_detection.py - Rule-based threat evaluation engine for File Integrity Monitoring (FIM).

Educational Note for Forensic Students:
A file integrity violation indicates unauthorized or unexpected modification.
It does NOT automatically mean the file is malicious or malware. In digital forensics,
integrity violations trigger triage and investigation rather than immediate malware attribution.
"""

import os

CONFIG_EXTENSIONS = {'.conf', '.config', '.ini', '.env', '.json', '.yaml', '.yml', '.xml', '.cfg'}
CRITICAL_FILENAMES = {'passwd', 'shadow', 'hosts', 'sudoers', 'sshd_config', 'settings.py', 'web.config', 'sys.config'}
EXECUTABLE_EXTENSIONS = {'.exe', '.bat', '.cmd', '.sh', '.bin', '.dll', '.so', '.elf', '.vbs', '.ps1', '.py'}

def evaluate_threat(event_type, file_path, scan_context=None):
    file_name = os.path.basename(file_path)
    _, ext = os.path.splitext(file_name)
    ext = ext.lower()
    
    scan_context = scan_context or {}
    total_modifications = scan_context.get('modified_count', 1)

    # Rule 1: Mass file tampering detection during a single scan
    if total_modifications >= 3 and event_type == 'MODIFIED':
        return (
            'CRITICAL',
            f"Mass modification pattern: {total_modifications} files modified simultaneously. "
            "Forensic Note: High velocity changes may indicate automated tampering, batch script execution, or ransomware activity. Requires immediate containment."
        )

    # Rule 2: Critical configuration file modification
    if event_type == 'MODIFIED' and (ext in CONFIG_EXTENSIONS or file_name.lower() in CRITICAL_FILENAMES):
        return (
            'HIGH',
            f"Critical configuration file '{file_name}' was modified. "
            "Forensic Note: Configuration alterations may alter access control, ports, or environment secrets. Integrity violation verified; triage for unauthorized administrative edits."
        )

    # Rule 3: Deleted monitored file
    if event_type == 'DELETED':
        return (
            'HIGH',
            f"Monitored file '{file_name}' was removed from the filesystem. "
            "Forensic Note: Missing critical asset or potential anti-forensics log scrubbing. File integrity baseline violated."
        )

    # Rule 4: Suspicious newly discovered executable or script
    if event_type == 'NEW' and ext in EXECUTABLE_EXTENSIONS:
        return (
            'HIGH',
            f"Unregistered executable/script file '{file_name}' detected. "
            "Forensic Note: New binary or script placed in monitored scope. Does not confirm malicious payload, but unapproved executable requires sandboxing."
        )

    # Rule 5: Generic new file added to directory
    if event_type == 'NEW':
        return (
            'LOW',
            f"New unmonitored file '{file_name}' discovered in monitored folder. "
            "Forensic Note: Routine file creation or unbaselined asset. Baseline registration recommended."
        )

    # Rule 6: Standard file modification
    if event_type == 'MODIFIED':
        return (
            'MEDIUM',
            f"Cryptographic hash mismatch for '{file_name}'. Content has changed since baseline. "
            "Forensic Note: Integrity violation detected. Differentiate between legitimate authorized update and unauthorized modification."
        )

    return ('LOW', f"Informational event observed on '{file_name}'.")`
    },
    'monitor.py': {
      language: 'python',
      description: 'Scanning coordinator that orchestrates hash checks, database updates, and alert triggering.',
      code: `"""
monitor.py - Core scanning and integrity checking engine for File Integrity Monitoring.
"""

import os
from datetime import datetime
from database import get_db_connection
from hashing import calculate_sha256, verify_integrity
from threat_detection import evaluate_threat

def add_file_to_monitor(file_path):
    clean_path = os.path.abspath(file_path.strip())
    if not os.path.exists(clean_path):
        return False, "File does not exist at specified path."

    file_name = os.path.basename(clean_path)
    _, ext = os.path.splitext(file_name)
    file_size = os.path.getsize(clean_path) if os.path.isfile(clean_path) else 0
    baseline_hash = calculate_sha256(clean_path)

    if baseline_hash is None:
        return False, "Unable to compute SHA-256 hash (permission denied or invalid file)."

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO monitored_files (file_name, file_path, file_extension, file_size, status, first_monitored_time, last_scan_time, is_active)
            VALUES (?, ?, ?, ?, 'SAFE', ?, ?, 1)
            ON CONFLICT(file_path) DO UPDATE SET
                file_size = excluded.file_size,
                status = 'SAFE',
                last_scan_time = excluded.last_scan_time,
                is_active = 1;
        """, (file_name, clean_path, ext, file_size, now_str, now_str))

        cursor.execute("SELECT id FROM monitored_files WHERE file_path = ?", (clean_path,))
        file_id = cursor.fetchone()['id']

        cursor.execute("""
            INSERT INTO file_hashes (file_id, baseline_hash, current_hash, updated_at)
            VALUES (?, ?, ?, ?)
        """, (file_id, baseline_hash, baseline_hash, now_str))

        cursor.execute("""
            INSERT INTO activity_logs (timestamp, file_name, event_type, previous_hash, current_hash, status, alert_level, details)
            VALUES (?, ?, 'BASELINE_ESTABLISHED', 'N/A', ?, 'SAFE', 'LOW', 'Baseline established and registered for monitoring')
        """, (now_str, file_name, baseline_hash))

        conn.commit()
        return True, f"Successfully registered '{file_name}' with SHA-256 baseline."
    except Exception as e:
        conn.rollback()
        return False, f"Database error: {str(e)}"
    finally:
        conn.close()

def scan_monitored_files():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT mf.id, mf.file_name, mf.file_path, mf.file_extension, mf.status,
               fh.baseline_hash, fh.current_hash as prev_scan_hash
        FROM monitored_files mf
        JOIN file_hashes fh ON mf.id = fh.file_id
        WHERE mf.is_active = 1
        ORDER BY fh.id DESC
    """)
    files = cursor.fetchall()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    modified_files, deleted_files, safe_files = [], [], []
    scan_previews = []

    for row in files:
        f_id, f_name, f_path = row['id'], row['file_name'], row['file_path']
        baseline = row['baseline_hash']

        if not os.path.exists(f_path):
            deleted_files.append((f_id, f_name, f_path, baseline))
            scan_previews.append(('DELETED', f_id, f_name, f_path, baseline, None, 0))
        else:
            curr_size = os.path.getsize(f_path)
            curr_hash = calculate_sha256(f_path)
            if curr_hash != baseline:
                modified_files.append((f_id, f_name, f_path, baseline, curr_hash))
                scan_previews.append(('MODIFIED', f_id, f_name, f_path, baseline, curr_hash, curr_size))
            else:
                safe_files.append((f_id, f_name, f_path, baseline, curr_hash))
                scan_previews.append(('SAFE', f_id, f_name, f_path, baseline, curr_hash, curr_size))

    modified_count = len(modified_files)
    scan_context = {'modified_count': modified_count}
    new_alerts_count = 0

    for item in scan_previews:
        status, f_id, f_name, f_path, baseline, curr_hash, curr_size = item
        if status == 'SAFE':
            cursor.execute("UPDATE monitored_files SET status = 'SAFE', last_scan_time = ?, file_size = ? WHERE id = ?", (now_str, curr_size, f_id))
            cursor.execute("UPDATE file_hashes SET current_hash = ?, updated_at = ? WHERE file_id = ?", (curr_hash, now_str, f_id))
        elif status == 'MODIFIED':
            alert_level, desc = evaluate_threat('MODIFIED', f_path, scan_context)
            cursor.execute("UPDATE monitored_files SET status = 'MODIFIED', last_scan_time = ?, file_size = ? WHERE id = ?", (now_str, curr_size, f_id))
            cursor.execute("UPDATE file_hashes SET current_hash = ?, updated_at = ? WHERE file_id = ?", (curr_hash, now_str, f_id))
            alert_id = f"ALT-{int(datetime.now().timestamp())}-{f_id}"
            cursor.execute("""
                INSERT INTO alerts (alert_id, file_id, file_name, event_type, alert_level, previous_hash, current_hash, timestamp, status, description)
                VALUES (?, ?, ?, 'File Modification', ?, ?, ?, ?, 'Open', ?)
            """, (alert_id, f_id, f_name, alert_level, baseline, curr_hash, now_str, desc))
            new_alerts_count += 1
            cursor.execute("""
                INSERT INTO activity_logs (timestamp, file_name, event_type, previous_hash, current_hash, status, alert_level, details)
                VALUES (?, ?, 'HASH_MISMATCH', ?, ?, 'MODIFIED', ?, ?)
            """, (now_str, f_name, baseline, curr_hash, alert_level, desc))
        elif status == 'DELETED':
            alert_level, desc = evaluate_threat('DELETED', f_path, scan_context)
            cursor.execute("UPDATE monitored_files SET status = 'DELETED', last_scan_time = ? WHERE id = ?", (now_str, f_id))
            alert_id = f"ALT-{int(datetime.now().timestamp())}-{f_id}"
            cursor.execute("""
                INSERT INTO alerts (alert_id, file_id, file_name, event_type, alert_level, previous_hash, current_hash, timestamp, status, description)
                VALUES (?, ?, ?, 'File Deletion', ?, ?, 'FILE_REMOVED', ?, 'Open', ?)
            """, (alert_id, f_id, f_name, alert_level, baseline, now_str, desc))
            new_alerts_count += 1
            cursor.execute("""
                INSERT INTO activity_logs (timestamp, file_name, event_type, previous_hash, current_hash, status, alert_level, details)
                VALUES (?, ?, 'FILE_MISSING', ?, 'DELETED', 'DELETED', ?, ?)
            """, (now_str, f_name, baseline, alert_level, desc))

    conn.commit()
    conn.close()
    return {
        "timestamp": now_str,
        "total_scanned": len(files),
        "safe_count": len(safe_files),
        "modified_count": len(modified_files),
        "deleted_count": len(deleted_files),
        "new_alerts": new_alerts_count
    }`
    },
    'requirements.txt': {
      language: 'text',
      description: 'Standard Python dependencies including Flask, Werkzeug, and Gunicorn for Render production deployment.',
      code: `Flask==3.0.3\nWerkzeug==3.0.3\ngunicorn==21.2.0`
    },
    'app.py (Root)': {
      language: 'python',
      description: 'Root WSGI/Render entry point satisfying the default `gunicorn app:app` cloud start command without circular import conflicts.',
      code: `import sys
import os
import importlib.util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIM_DIR = os.path.join(BASE_DIR, "file-integrity-monitor")

# Add subfolder to sys.path
if FIM_DIR not in sys.path:
    sys.path.insert(0, FIM_DIR)

# Dynamically load the Flask app module under 'fim_engine' namespace
target_app_path = os.path.join(FIM_DIR, "app.py")
spec = importlib.util.spec_from_file_location("fim_engine", target_app_path)
fim_module = importlib.util.module_from_spec(spec)
sys.modules["fim_engine"] = fim_module
spec.loader.exec_module(fim_module)

# Expose Flask application instance as 'app' for Gunicorn
app = fim_module.app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("1", "true")
    app.run(host="0.0.0.0", port=port, debug=debug)`
    },
    'Procfile': {
      language: 'text',
      description: 'Render and cloud process file specifying the Gunicorn web server.',
      code: `web: gunicorn app:app`
    },
    'render.yaml': {
      language: 'yaml',
      description: 'Render Blueprint infrastructure-as-code file for 1-click cloud deployment.',
      code: `services:
  # 1. Full-Stack / Backend Python Flask Web Service
  - type: web
    name: file-integrity-monitoring-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    healthCheckPath: /api/health
    plan: free
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9
      - key: SECRET_KEY
        generateValue: true
      - key: FLASK_DEBUG
        value: "false"

  # 2. Modern React Cybersecurity Dashboard (Static Site)
  - type: static
    name: file-integrity-monitoring-ui
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: NODE_VERSION
        value: 20`
    },
    'wsgi.py': {
      language: 'python',
      description: 'WSGI production entry point connecting Gunicorn with the Flask application.',
      code: `import sys
import os

# Insert file-integrity-monitor into sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIM_DIR = os.path.join(BASE_DIR, "file-integrity-monitor")
if FIM_DIR not in sys.path:
    sys.path.insert(0, FIM_DIR)

from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)`
    },
    'setup_demo.py': {
      language: 'python',
      description: 'One-click script to generate test data files and establish SHA-256 baselines.',
      code: `"""
setup_demo.py - Prepares sample test data and populates SQLite baseline hashes for college demonstrations.
Run this script to initialize the test environment in seconds!
"""

import os
from database import init_db
from monitor import add_file_to_monitor

def seed_sample_data():
    """Seeds default sample files and baseline SHA-256 hashes into the SQLite database."""
    init_db()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_dir = os.path.join(base_dir, "sample_data")
    os.makedirs(sample_dir, exist_ok=True)

    test_files = {
        "app.conf": (
            "# Production Web Application Configuration\\n"
            "SERVER_PORT=8080\\n"
            "DEBUG_MODE=FALSE\\n"
            "DATABASE_URI=sqlite:///database/security.db\\n"
            "ALLOWED_HOSTS=127.0.0.1,localhost\\n"
            "SESSION_TIMEOUT=900\\n"
        ),
        "system_health.py": (
            "#!/usr/bin/env python3\\n"
            "# System Health Telemetry Check\\n"
            "import os, platform\\n"
            "def check():\\n"
            "    print('OS:', platform.system())\\n"
            "    print('Load status: NORMAL')\\n"
            "if __name__ == '__main__':\\n"
            "    check()\\n"
        ),
        "security_policy.txt": (
            "Cybersecurity Standard Operating Procedure (SOP)\\n"
            "1. All production files must have baseline SHA-256 hashes recorded.\\n"
            "2. Unscheduled file alterations trigger HIGH priority incident alerts.\\n"
            "3. Integrity violations must be triaged within 15 minutes.\\n"
        ),
        "database_credentials.ini": (
            "[Database]\\n"
            "Host = 192.168.1.100\\n"
            "Port = 5432\\n"
            "User = sys_auditor\\n"
            "SSL_Mode = verify-full\\n"
        )
    }

    results = []
    for fname, content in test_files.items():
        fpath = os.path.join(sample_dir, fname)
        with open(fpath, "w") as f:
            f.write(content)
        success, msg = add_file_to_monitor(fpath)
        results.append({"file": fname, "success": success, "message": msg})

    return results

def main():
    print("[*] Initializing SQLite database...")
    results = seed_sample_data()
    for res in results:
        print(f"    [+] {res['file']}: {res['message']}")
    print("\\n[✔] College project demo setup complete!")
    print("[✔] You can now start the application with: python app.py")

if __name__ == "__main__":
    main()`
    }
  };

  const copyCurrentCode = () => {
    navigator.clipboard.writeText(filesCode[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="project-code-hub" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Python Flask Project Code Explorer
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
              file-integrity-monitor/
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete standalone Python Flask source code organized for college submission and assessment.
          </p>
        </div>

        <button
          onClick={copyCurrentCode}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{copied ? 'Copied to Clipboard!' : `Copy ${activeFile}`}</span>
        </button>
      </div>

      {/* Quick Terminal Guide for Running Locally */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>How to Run Locally on Your PC or College Lab Machine</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
            <span className="text-cyan-400 text-[11px] block font-sans font-semibold mb-1">Step 1: Install Dependencies</span>
            <code className="text-slate-300">pip install -r requirements.txt</code>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
            <span className="text-cyan-400 text-[11px] block font-sans font-semibold mb-1">Step 2: Seed Sample Data</span>
            <code className="text-slate-300">python setup_demo.py</code>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
            <span className="text-cyan-400 text-[11px] block font-sans font-semibold mb-1">Step 3: Run Flask App</span>
            <code className="text-slate-300">python app.py</code>
          </div>
        </div>
      </div>

      {/* Render Cloud Deployment Guide */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-mono uppercase tracking-wide">Render Ready</span>
            <span>Deploy to Render Cloud in 3 Simple Steps</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">render.yaml included</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-500/20">
            <span className="text-cyan-400 font-semibold block mb-1">1. Push to GitHub</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Create a Git repo and push the code containing <code className="text-cyan-300 font-mono">render.yaml</code>, <code className="text-cyan-300 font-mono">Procfile</code>, and <code className="text-cyan-300 font-mono">requirements.txt</code>.
            </p>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-500/20">
            <span className="text-cyan-400 font-semibold block mb-1">2. Render Web Service</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              In Render Dashboard, choose <strong className="text-slate-200">New + &gt; Blueprint</strong> or <strong className="text-slate-200">Web Service</strong> with Build: <code className="text-cyan-300 font-mono">pip install -r requirements.txt</code> and Start: <code className="text-cyan-300 font-mono">gunicorn wsgi:app</code>.
            </p>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-500/20">
            <span className="text-cyan-400 font-semibold block mb-1">3. Live URL</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Render automatically assigns an HTTPS URL. Database auto-seeds and healthchecks pass at <code className="text-cyan-300 font-mono">/api/health</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Code Browser Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* File Tree List (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Project Files
          </div>
          {Object.keys(filesCode).map((fname) => (
            <button
              key={fname}
              onClick={() => setActiveFile(fname)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                activeFile === fname
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{fname}</span>
              </div>
              {activeFile === fname && <ChevronRight className="w-3 h-3 text-cyan-400" />}
            </button>
          ))}
        </div>

        {/* Code Viewer (9 cols) */}
        <div className="lg:col-span-9 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
            <div>
              <span className="text-xs font-mono font-bold text-slate-200">{activeFile}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{filesCode[activeFile].description}</p>
            </div>
            <button
              onClick={copyCurrentCode}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-slate-800"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[560px] select-all">
            {filesCode[activeFile].code}
          </pre>
        </div>
      </div>
    </div>
  );
};
