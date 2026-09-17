"""
app.py
Main Flask application entry point for the File Integrity Monitoring and Threat Detection System.
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

    # Aggregate statistics
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

    # Recent alerts
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 5")
    recent_alerts = cursor.fetchall()

    # Recent activity logs
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
    flash(f"Scan completed: {summary['total_scanned']} files checked. Safe: {summary['safe_count']}, Modified: {summary['modified_count']}, Deleted: {summary['deleted_count']}, Alerts generated: {summary['new_alerts']}", "info")
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
    # Host on 0.0.0.0 and port 5000 for standard local Flask development
    print("=" * 60)
    print("  File Integrity Monitoring and Threat Detection System")
    print("  College Cybersecurity & Digital Forensics Laboratory")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
