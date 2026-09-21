"""
app.py
Main Flask application entry point for the File Integrity Monitoring and Threat Detection System.
Designed for college cybersecurity & digital forensic science projects.
"""

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory
import os
import sqlite3
from database import get_db_connection, init_db
from hashing import calculate_sha256
from monitor import add_file_to_monitor, scan_monitored_files
from threat_detection import evaluate_threat
from setup_demo import seed_sample_data

# Absolute path resolution so app runs cleanly from root or subfolder
FIM_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(FIM_DIR)
DIST_DIR = os.path.join(ROOT_DIR, "dist")
HAS_VITE_BUILD = os.path.isfile(os.path.join(DIST_DIR, "index.html"))
TEMPLATES_DIR = os.path.join(FIM_DIR, "templates")
STATIC_DIR = os.path.join(FIM_DIR, "static")

app = Flask(
    __name__,
    static_folder=STATIC_DIR,
    template_folder=TEMPLATES_DIR
)
app.secret_key = os.environ.get("SECRET_KEY", "fim-security-educational-key")

# Ensure database tables exist and auto-seed if clean database
init_db()
try:
    _conn = get_db_connection()
    _cur = _conn.cursor()
    _cur.execute("SELECT COUNT(*) as cnt FROM monitored_files")
    if _cur.fetchone()['cnt'] == 0:
        print("[*] Empty database detected. Seeding sample lab demonstration files...")
        seed_sample_data()
    _conn.close()
except Exception as _e:
    print(f"[!] Note on auto-seed: {_e}")

@app.after_request
def enable_cors(response):
    """Enable CORS so frontend can communicate with API across origins if deployed separately."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# -------------------------------------------------------------
# Web UI Routes
# -------------------------------------------------------------
@app.route("/")
def dashboard():
    """Renders the dashboard. If Vite build exists, serves SPA; else serves Jinja2 template."""
    if HAS_VITE_BUILD and os.path.isfile(os.path.join(DIST_DIR, "index.html")):
        return send_from_directory(DIST_DIR, "index.html")
    return classic_dashboard()

@app.route("/classic")
def classic_dashboard():
    """Renders the central server-rendered cybersecurity dashboard."""
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
    flash(f"Scan completed: {summary['total_scanned']} files checked. Safe: {summary['safe_count']}, Modified: {summary['modified_count']}, Deleted: {summary['deleted_count']}, Alerts generated: {summary['new_alerts']}", "info")
    return redirect(url_for("classic_dashboard" if HAS_VITE_BUILD else "dashboard"))

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

# -------------------------------------------------------------
# REST API Endpoints (for React UI or programmatic API clients)
# -------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def api_health():
    """Healthcheck endpoint for Render / monitoring."""
    return jsonify({
        "status": "healthy",
        "service": "File Integrity Monitoring and Threat Detection Engine",
        "algorithm": "SHA-256",
        "sqlite_database": "connected"
    })

@app.route("/api/stats", methods=["GET"])
def api_stats():
    """Returns aggregated monitoring statistics in JSON."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM monitored_files WHERE is_active = 1")
    total = cursor.fetchone()['total']
    cursor.execute("SELECT COUNT(*) as safe FROM monitored_files WHERE status = 'SAFE' AND is_active = 1")
    safe = cursor.fetchone()['safe']
    cursor.execute("SELECT COUNT(*) as modified FROM monitored_files WHERE status = 'MODIFIED' AND is_active = 1")
    modified = cursor.fetchone()['modified']
    cursor.execute("SELECT COUNT(*) as deleted FROM monitored_files WHERE status = 'DELETED' AND is_active = 1")
    deleted = cursor.fetchone()['deleted']
    cursor.execute("SELECT COUNT(*) as new_files FROM monitored_files WHERE status = 'NEW' AND is_active = 1")
    new_files = cursor.fetchone()['new_files']
    cursor.execute("SELECT COUNT(*) as total_alerts FROM alerts")
    total_alerts = cursor.fetchone()['total_alerts']
    cursor.execute("SELECT COUNT(*) as open_alerts FROM alerts WHERE status = 'Open'")
    open_alerts = cursor.fetchone()['open_alerts']

    conn.close()
    return jsonify({
        "total_files": total,
        "safe_files": safe,
        "modified_files": modified,
        "deleted_files": deleted,
        "new_files": new_files,
        "total_alerts": total_alerts,
        "open_alerts": open_alerts
    })

@app.route("/api/files", methods=["GET", "POST"])
def api_files():
    """GET list of files or POST to register a new file for monitoring."""
    if request.method == "POST":
        data = request.get_json(silent=True) or request.form
        file_path = data.get("file_path", "").strip()
        if not file_path:
            return jsonify({"success": False, "error": "file_path is required"}), 400

        success, msg = add_file_to_monitor(file_path)
        status_code = 201 if success else 400
        return jsonify({"success": success, "message": msg}), status_code

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT mf.id, mf.file_name, mf.file_path, mf.file_extension, mf.file_size,
               mf.status, mf.first_monitored_time, mf.last_scan_time,
               fh.baseline_hash, fh.current_hash, fh.updated_at
        FROM monitored_files mf
        LEFT JOIN file_hashes fh ON mf.id = fh.file_id
        WHERE mf.is_active = 1
        ORDER BY mf.id DESC
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "files": rows, "count": len(rows)})

@app.route("/api/scan", methods=["POST", "GET"])
def api_scan():
    """Triggers an integrity scan across all active files."""
    summary = scan_monitored_files()
    return jsonify({"success": True, "scan_summary": summary})

@app.route("/api/alerts", methods=["GET"])
def api_alerts():
    """Returns list of all security alerts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "alerts": rows, "count": len(rows)})

@app.route("/api/alerts/<int:alert_id>/status", methods=["PATCH", "POST"])
def api_update_alert(alert_id):
    """Updates an alert triage status."""
    data = request.get_json(silent=True) or request.form
    new_status = data.get("status")
    if new_status not in ["Open", "Investigating", "Resolved"]:
        return jsonify({"success": False, "error": "Invalid status. Must be Open, Investigating, or Resolved."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET status = ? WHERE id = ?", (new_status, alert_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected == 0:
        return jsonify({"success": False, "error": "Alert not found"}), 404
    return jsonify({"success": True, "message": f"Alert #{alert_id} updated to {new_status}"})

@app.route("/api/logs", methods=["GET"])
def api_logs():
    """Returns chronological activity logs."""
    limit = request.args.get("limit", 100, type=int)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "logs": rows, "count": len(rows)})

@app.route("/api/seed", methods=["POST"])
def api_seed():
    """Seeds sample demonstration files."""
    results = seed_sample_data()
    return jsonify({"success": True, "seeded_files": results})

@app.route("/api/simulate/<scenario>", methods=["POST"])
def api_simulate(scenario):
    """Simulates real-world tampering attack scenarios for lab demonstrations."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_dir = os.path.join(base_dir, "sample_data")
    conf_path = os.path.join(sample_dir, "app.conf")

    if scenario == "modify_config":
        if os.path.exists(conf_path):
            with open(conf_path, "a") as f:
                f.write("\n# [TAMPERED_BY_ATTACKER]\nREMOTE_ACCESS=ENABLED\nPORT=4444\n")
            summary = scan_monitored_files()
            return jsonify({"success": True, "scenario": scenario, "details": "Tampered app.conf with unauthorized remote access configuration", "scan_summary": summary})
        return jsonify({"success": False, "error": "app.conf sample file not found"}), 404

    elif scenario == "delete_file":
        health_path = os.path.join(sample_dir, "system_health.py")
        if os.path.exists(health_path):
            os.remove(health_path)
            summary = scan_monitored_files()
            return jsonify({"success": True, "scenario": scenario, "details": "Deleted system_health.py to simulate asset destruction", "scan_summary": summary})
        return jsonify({"success": False, "error": "system_health.py not found"}), 404

    elif scenario == "restore_all":
        seed_sample_data()
        summary = scan_monitored_files()
        return jsonify({"success": True, "scenario": scenario, "details": "Restored authoritative baselines for all sample files", "scan_summary": summary})

    return jsonify({"success": False, "error": f"Unknown scenario '{scenario}'"}), 400

# Catch-all for SPA client routing when dist is built
@app.route("/<path:path>")
def static_proxy(path):
    if HAS_VITE_BUILD and os.path.isfile(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    if HAS_VITE_BUILD and os.path.isfile(os.path.join(DIST_DIR, "index.html")):
        return send_from_directory(DIST_DIR, "index.html")
    return "Page not found", 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("1", "true")
    print("=" * 60)
    print("  File Integrity Monitoring and Threat Detection System")
    print(f"  Running on port {port} (debug={debug})")
    print("=" * 60)
    app.run(host="0.0.0.0", port=port, debug=debug)
