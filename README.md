# File Integrity Monitoring and Threat Detection System

A web-based cybersecurity monitoring and digital forensic application designed for a **B.Sc Digital and Cyber Forensic Science** college project. It detects unauthorized file modifications, unauthorized file deletions, and suspicious dropped executables using cryptographic **SHA-256** baseline digests and a deterministic rule-based threat classification engine.

---

## 1. Project Abstract

In digital forensics, system auditing, and regulatory compliance (e.g., PCI-DSS 11.5, NIST SP 800-53), maintaining the integrity of operating system binaries, critical configuration files, and access credentials is a core defense requirement. 

The **File Integrity Monitoring and Threat Detection System** allows security analysts and system administrators to:
1. Register critical files and directories to establish cryptographic **SHA-256** baseline fingerprints.
2. Execute on-demand or periodic integrity scans that recalculate current cryptographic digests and verify byte-for-byte fidelity.
3. Categorize detected anomalies into four standardized threat levels (**LOW**, **MEDIUM**, **HIGH**, **CRITICAL**).
4. Emphasize a vital forensic distinction: **a file integrity violation indicates unexpected modification, not confirmed malware infection**.
5. Maintain an immutable chronological security audit trail in **SQLite** for evidence preservation and post-incident reporting.

---

## 2. Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Python 3.10+ / Flask | HTTP REST API, scanning coordinator, threat rule engine |
| **Database** | SQLite 3 (`security.db`) | Relational baseline storage, alert queue, chronological logs |
| **Cryptography** | SHA-256 (`hashlib` / Web Crypto) | 256-bit cryptographic one-way hashing |
| **Frontend 1** | Python Flask + Jinja2 Templates | Traditional server-rendered web interface |
| **Frontend 2** | React 18, Vite, Tailwind CSS | Modern interactive forensic operations console |
| **Icons** | Lucide React | Visual indicator cues and status badges |
| **Cost** | 100% Free / Open Source | No paid third-party APIs required |

---

## 3. Database Architecture (SQLite)

The system uses four normalized SQLite tables with foreign keys and index optimization:

### 1. `monitored_files`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `file_name` (TEXT NOT NULL)
- `file_path` (TEXT UNIQUE NOT NULL)
- `file_extension` (TEXT)
- `file_size` (INTEGER DEFAULT 0)
- `status` (TEXT DEFAULT 'SAFE' — `SAFE`, `MODIFIED`, `DELETED`, `NEW`)
- `first_monitored_time` (TEXT NOT NULL)
- `last_scan_time` (TEXT)
- `is_active` (INTEGER DEFAULT 1)

### 2. `file_hashes`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `file_id` (INTEGER NOT NULL, FOREIGN KEY -> `monitored_files(id)`)
- `baseline_hash` (TEXT NOT NULL — 64 hex characters)
- `current_hash` (TEXT NOT NULL — 64 hex characters)
- `updated_at` (TEXT NOT NULL)

### 3. `alerts`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `alert_id` (TEXT UNIQUE NOT NULL, e.g., `ALT-2026-001`)
- `file_id` (INTEGER, FOREIGN KEY -> `monitored_files(id)`)
- `file_name` (TEXT NOT NULL)
- `event_type` (TEXT NOT NULL)
- `alert_level` (TEXT NOT NULL — `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `previous_hash` (TEXT)
- `current_hash` (TEXT)
- `timestamp` (TEXT NOT NULL)
- `status` (TEXT DEFAULT 'Open' — `Open`, `Investigating`, `Resolved`)
- `description` (TEXT)

### 4. `activity_logs`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `timestamp` (TEXT NOT NULL)
- `file_name` (TEXT NOT NULL)
- `event_type` (TEXT NOT NULL)
- `previous_hash` (TEXT)
- `current_hash` (TEXT)
- `status` (TEXT NOT NULL)
- `alert_level` (TEXT NOT NULL)
- `details` (TEXT)

---

## 4. Threat Detection Rules & Severity Hierarchy

The deterministic rule engine categorizes events according to forensic severity:

| Severity | Trigger Rule | Forensic Rationale |
| :--- | :--- | :--- |
| **CRITICAL** | **Mass File Modifications** (>= 3 files altered simultaneously during one scan) | Rapid batch modifications may indicate automated ransomware encryption or batch wiping scripts. Requires emergency incident containment. |
| **HIGH** | **Critical Configuration Modification** (`.conf`, `.ini`, `.env`, `.json`, `hosts`, etc.) | Configuration modifications alter network ports, database credentials, or access controls. High risk of privilege escalation. |
| **HIGH** | **Monitored File Deletion** (file missing from filesystem) | Monitored assets disappeared; could represent anti-forensic log tampering or vital service destruction. |
| **HIGH** | **Suspicious Executable Discovered** (`.exe`, `.sh`, `.py`, `.bat`, `.bin`) | Unregistered executable or script placed in monitored scope. Requires immediate sandbox inspection. |
| **MEDIUM** | **Standard File Content Mismatch** (generic document or script altered) | Cryptographic hash divergence detected. Analyst must triage if the change was scheduled or unauthorized. |
| **LOW** | **Routine New File or Baseline Creation** | Informational baseline registration or routine text file addition. |

> **Critical Forensic Principle:**
> An integrity violation proves cryptographic divergence occurred (i.e. bits have changed). It does **not** prove malicious software or malware infection. Legitimate software upgrades and administrative edits also alter file hashes. In digital forensics, integrity alerts mandate triage to verify change authorization.

---

## 5. Quick Start & Execution Guide

### Option A: Running the Python Flask Application
```bash
# 1. Navigate to the Flask project directory
cd file-integrity-monitor

# 2. Install dependencies (Python 3.10+)
pip install -r requirements.txt

# 3. Populate sample test data and compute initial SHA-256 baselines
python setup_demo.py

# 4. Start the Flask server
python app.py
```
Open `http://localhost:5000` in your web browser.

### Option B: Running the Interactive React Forensic Console
```bash
# 1. Install frontend dependencies
npm install

# 2. Start Vite development server
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 6. How to Test and Demonstrate for College Viva / Lab Exam

1. **View Clean Baseline:**
   - Launch the dashboard and note the initial state: all files show `SAFE` with matching SHA-256 baseline and current hashes.
2. **Simulate Configuration Tampering:**
   - In the header or files view, select **"Simulate Attack: Modify app.conf"**.
   - Notice that altering a single line changes the entire 64-character SHA-256 digest (The **Avalanche Effect**).
   - Click **"Scan Files Now"**. The scanner flags the divergence and raises a **HIGH** severity alert.
3. **Simulate Dropped Executable:**
   - Select **"Simulate Attack: Drop Executable"**.
   - An unapproved script `backdoor.sh` is introduced.
   - The scanner triggers a **HIGH** alert for an unauthorized executable.
4. **Simulate Ransomware Mass Tampering:**
   - Select **"Simulate Attack: Mass Tampering (3+ files)"**.
   - The scanner evaluates the heuristic: 3 files altered at once triggers a **CRITICAL** alert.
5. **Simulate File Deletion:**
   - Delete a file (e.g. `database_backup.sql`).
   - The scanner triggers a **HIGH** alert for a missing monitored file.
6. **Triage & Resolve:**
   - Navigate to the **Security Alerts** page.
   - Review the previous SHA-256 vs. current SHA-256.
   - Change alert status from `Open` to `Investigating`, and then to `Resolved`.
7. **Audit Trail Verification:**
   - Open **Activity Logs** to view the chronological timeline.
   - Click **"Export Forensic Audit Trail (CSV)"** to demonstrate evidence preservation.

---

## 7. Model Viva Questions & Forensic Answers

**Q1: What is the primary purpose of File Integrity Monitoring (FIM)?**  
*Answer:* FIM is an internal control that verifies the authenticity and integrity of operating system files, application binaries, and configuration files by comparing cryptographic checksums against a trusted baseline.

**Q2: Why is SHA-256 preferred over MD5 and SHA-1?**  
*Answer:* MD5 and SHA-1 are cryptographically broken and subject to practical collision attacks (where two distinct files produce identical digests). SHA-256 produces a 256-bit digest with high collision and pre-image resistance.

**Q3: What is the cryptographic Avalanche Effect?**  
*Answer:* If even one bit in the input file is changed, the resulting SHA-256 hash changes radically and unpredictably across ~50% of the output bits, making any byte manipulation immediately detectable.

**Q4: Does a file integrity alert mean a malware infection has occurred?**  
*Answer:* No. A file integrity violation signifies that the file's bytes have changed. This could be caused by an authorized administrator patch, a routine software update, or an unauthorized intruder. It warrants triage, not automated malware attribution.

**Q5: How does SQLite maintain data integrity in this system?**  
*Answer:* SQLite enforces primary keys (`id`), unique constraints (`file_path`, `alert_id`), foreign key cascading, and ACID compliance to guarantee that audit trails cannot be corrupted by abrupt application termination.
