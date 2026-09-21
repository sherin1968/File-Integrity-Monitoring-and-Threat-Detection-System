"""
app.py (Root entry point)
Entry point for Render Cloud Deployment and standalone execution.
Directly satisfies Render's default command: `gunicorn app:app`
Bypasses circular import shadowing between root app.py and file-integrity-monitor/app.py.
"""

import sys
import os
import importlib.util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIM_DIR = os.path.join(BASE_DIR, "file-integrity-monitor")

# Add subfolder to sys.path so database, hashing, monitor, and threat_detection can be resolved
if FIM_DIR not in sys.path:
    sys.path.insert(0, FIM_DIR)

# Dynamically load the Flask app module from the subfolder under an explicit namespace 'fim_engine'
# This prevents Python from attempting to import this file (app.py) recursively.
target_app_path = os.path.join(FIM_DIR, "app.py")
spec = importlib.util.spec_from_file_location("fim_engine", target_app_path)
if spec is None or spec.loader is None:
    raise ImportError(f"Could not load application specification from {target_app_path}")

fim_module = importlib.util.module_from_spec(spec)
sys.modules["fim_engine"] = fim_module
spec.loader.exec_module(fim_module)

# Expose the Flask WSGI application instance as 'app' for Gunicorn (`gunicorn app:app`)
app = fim_module.app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("1", "true")
    app.run(host="0.0.0.0", port=port, debug=debug)
