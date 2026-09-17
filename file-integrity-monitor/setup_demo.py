"""
setup_demo.py
Prepares sample test data and populates SQLite baseline hashes for college demonstrations.
Run this script to initialize the test environment in seconds!
"""

import os
from database import init_db
from monitor import add_file_to_monitor

def main():
    print("[*] Initializing SQLite database...")
    init_db()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_dir = os.path.join(base_dir, "sample_data")
    os.makedirs(sample_dir, exist_ok=True)

    test_files = {
        "app.conf": (
            "# Production Web Application Configuration\n"
            "SERVER_PORT=8080\n"
            "DEBUG_MODE=FALSE\n"
            "DATABASE_URI=sqlite:///database/security.db\n"
            "ALLOWED_HOSTS=127.0.0.1,localhost\n"
            "SESSION_TIMEOUT=900\n"
        ),
        "system_health.py": (
            "#!/usr/bin/env python3\n"
            "# System Health Telemetry Check\n"
            "import os, platform\n"
            "def check():\n"
            "    print('OS:', platform.system())\n"
            "    print('Load status: NORMAL')\n"
            "if __name__ == '__main__':\n"
            "    check()\n"
        ),
        "security_policy.txt": (
            "Cybersecurity Standard Operating Procedure (SOP)\n"
            "1. All production files must have baseline SHA-256 hashes recorded.\n"
            "2. Unscheduled file alterations trigger HIGH priority incident alerts.\n"
            "3. Integrity violations must be triaged within 15 minutes.\n"
        ),
        "database_credentials.ini": (
            "[Database]\n"
            "Host = 192.168.1.100\n"
            "Port = 5432\n"
            "User = sys_auditor\n"
            "SSL_Mode = verify-full\n"
        )
    }

    print("[*] Writing sample files into:", sample_dir)
    for fname, content in test_files.items():
        fpath = os.path.join(sample_dir, fname)
        with open(fpath, "w") as f:
            f.write(content)
        success, msg = add_file_to_monitor(fpath)
        print(f"    [+] {fname}: {msg}")

    print("\n[✔] College project demo setup complete!")
    print("[✔] You can now start the application with: python app.py")

if __name__ == "__main__":
    main()
