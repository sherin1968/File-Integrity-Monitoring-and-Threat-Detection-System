"""
wsgi.py
Production WSGI entry point for deploying File Integrity Monitoring on Render.
Supports both the Gunicorn WSGI server (`gunicorn wsgi:app`) and standalone execution.
"""

import sys
import os

# Root app exports `app` cleanly without circular references
from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("1", "true")
    app.run(host="0.0.0.0", port=port, debug=debug)
