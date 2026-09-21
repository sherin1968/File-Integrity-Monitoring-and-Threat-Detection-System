"""
database.py
SQLite Database initialization and helper functions for File Integrity Monitoring.
"""

import sqlite3
import os
from datetime import datetime

DB_DIR = os.environ.get("DATABASE_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "database"))
DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(DB_DIR, "security.db"))

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
        file_id INTEGER UNIQUE NOT NULL,
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
    init_db()
