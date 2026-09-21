"""
wsgi.py
Production WSGI entry point for deploying File Integrity Monitoring on Render.
Supports both the Gunicorn WSGI server and standalone execution.
"""

import sys
import os

# Insert file-integrity-monitor into sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIM_DIR = os.path.join(BASE_DIR, "file-integrity-monitor")
if FIM_DIR not in sys.path:
    sys.path.insert(0, FIM_DIR)

from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
