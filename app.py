"""
app.py (Root entry point)
Entry point for Render Cloud Deployment and standalone execution.
Directly satisfies Render's default command: `gunicorn app:app`
"""

import sys
import os

# Add file-integrity-monitor to sys.path so all internal modules (database, hashing, monitor, threat_detection)
# can be imported seamlessly without modifying internal relative imports.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIM_DIR = os.path.join(BASE_DIR, "file-integrity-monitor")
if FIM_DIR not in sys.path:
    sys.path.insert(0, FIM_DIR)

# Import the configured Flask application instance
from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("1", "true")
    app.run(host="0.0.0.0", port=port, debug=debug)
