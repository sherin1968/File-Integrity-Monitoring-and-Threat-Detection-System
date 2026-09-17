"""
monitor.py
Core scanning and integrity checking engine for File Integrity Monitoring.
"""

import os
from datetime import datetime
from database import get_db_connection
from hashing import calculate_sha256, verify_integrity
from threat_detection import evaluate_threat

def add_file_to_monitor(file_path):
    """
    Registers a file, calculates its initial SHA-256 baseline, and records it in SQLite.
    """
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
        # Insert or reactivate file
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

        # Store baseline hash
        cursor.execute("""
            INSERT INTO file_hashes (file_id, baseline_hash, current_hash, updated_at)
            VALUES (?, ?, ?, ?)
        """, (file_id, baseline_hash, baseline_hash, now_str))

        # Log event
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
    """
    Scans all registered files:
    - Calculates current SHA-256
    - Compares with stored baseline hash
    - Detects SAFE, MODIFIED, DELETED
    - Applies threat detection rules
    - Generates alerts & activity logs
    """
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
    modified_files = []
    deleted_files = []
    safe_files = []
    new_alerts_count = 0

    # First pass: identify modified and deleted
    scan_previews = []
    for row in files:
        f_id = row['id']
        f_name = row['file_name']
        f_path = row['file_path']
        baseline = row['baseline_hash']
        prev_scan = row['prev_scan_hash']

        if not os.path.exists(f_path):
            deleted_files.append((f_id, f_name, f_path, baseline, prev_scan))
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

    # Second pass: commit updates and evaluate threats
    modified_count = len(modified_files)
    scan_context = {'modified_count': modified_count}

    for item in scan_previews:
        status, f_id, f_name, f_path, baseline, curr_hash, curr_size = item

        if status == 'SAFE':
            cursor.execute("""
                UPDATE monitored_files
                SET status = 'SAFE', last_scan_time = ?, file_size = ?
                WHERE id = ?
            """, (now_str, curr_size, f_id))

            cursor.execute("""
                UPDATE file_hashes
                SET current_hash = ?, updated_at = ?
                WHERE file_id = ?
            """, (curr_hash, now_str, f_id))

        elif status == 'MODIFIED':
            alert_level, desc = evaluate_threat('MODIFIED', f_path, scan_context)

            cursor.execute("""
                UPDATE monitored_files
                SET status = 'MODIFIED', last_scan_time = ?, file_size = ?
                WHERE id = ?
            """, (now_str, curr_size, f_id))

            cursor.execute("""
                UPDATE file_hashes
                SET current_hash = ?, updated_at = ?
                WHERE file_id = ?
            """, (curr_hash, now_str, f_id))

            # Generate Alert
            alert_id = f"ALT-{int(datetime.now().timestamp())}-{f_id}"
            cursor.execute("""
                INSERT INTO alerts (alert_id, file_id, file_name, event_type, alert_level, previous_hash, current_hash, timestamp, status, description)
                VALUES (?, ?, ?, 'File Modification', ?, ?, ?, ?, 'Open', ?)
            """, (alert_id, f_id, f_name, alert_level, baseline, curr_hash, now_str, desc))
            new_alerts_count += 1

            # Activity Log
            cursor.execute("""
                INSERT INTO activity_logs (timestamp, file_name, event_type, previous_hash, current_hash, status, alert_level, details)
                VALUES (?, ?, 'HASH_MISMATCH', ?, ?, 'MODIFIED', ?, ?)
            """, (now_str, f_name, baseline, curr_hash, alert_level, desc))

        elif status == 'DELETED':
            alert_level, desc = evaluate_threat('DELETED', f_path, scan_context)

            cursor.execute("""
                UPDATE monitored_files
                SET status = 'DELETED', last_scan_time = ?
                WHERE id = ?
            """, (now_str, f_id))

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
    }
