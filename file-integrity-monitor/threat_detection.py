"""
threat_detection.py
Rule-based threat evaluation engine for File Integrity Monitoring (FIM).

Educational Note for Forensic Students:
A file integrity violation indicates unauthorized or unexpected modification.
It does NOT automatically mean the file is malicious or malware. In digital forensics,
integrity violations trigger triage and investigation rather than immediate malware attribution.
"""

import os
from datetime import datetime

# Critical system/config extensions and patterns
CONFIG_EXTENSIONS = {'.conf', '.config', '.ini', '.env', '.json', '.yaml', '.yml', '.xml', '.cfg'}
CRITICAL_FILENAMES = {'passwd', 'shadow', 'hosts', 'sudoers', 'sshd_config', 'settings.py', 'web.config', 'sys.config'}

# Executable file extensions commonly audited in incident response
EXECUTABLE_EXTENSIONS = {'.exe', '.bat', '.cmd', '.sh', '.bin', '.dll', '.so', '.elf', '.vbs', '.ps1', '.py'}

def evaluate_threat(event_type, file_path, scan_context=None):
    """
    Evaluates an event using deterministic security rules.
    
    Args:
        event_type (str): 'MODIFIED', 'DELETED', 'NEW', or 'BATCH_TAMPERING'
        file_path (str): Path of the file involved
        scan_context (dict, optional): Context like total_modifications in the scan
        
    Returns:
        tuple: (alert_level, description)
            alert_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            description: Detailed forensic finding
    """
    file_name = os.path.basename(file_path)
    _, ext = os.path.splitext(file_name)
    ext = ext.lower()
    
    scan_context = scan_context or {}
    total_modifications = scan_context.get('modified_count', 1)

    # Rule 1: Mass file tampering detection during a single scan
    if total_modifications >= 3 and event_type == 'MODIFIED':
        return (
            'CRITICAL',
            f"Mass modification pattern: {total_modifications} files modified simultaneously. "
            "Forensic Note: High velocity changes may indicate automated tampering, batch script execution, or ransomware activity. Requires immediate containment."
        )

    # Rule 2: Critical configuration file modification
    if event_type == 'MODIFIED' and (ext in CONFIG_EXTENSIONS or file_name.lower() in CRITICAL_FILENAMES):
        return (
            'HIGH',
            f"Critical configuration file '{file_name}' was modified. "
            "Forensic Note: Configuration alterations may alter access control, ports, or environment secrets. Integrity violation verified; triage for unauthorized administrative edits."
        )

    # Rule 3: Deleted monitored file
    if event_type == 'DELETED':
        return (
            'HIGH',
            f"Monitored file '{file_name}' was removed from the filesystem. "
            "Forensic Note: Missing critical asset or potential anti-forensics log scrubbing. File integrity baseline violated."
        )

    # Rule 4: Suspicious newly discovered executable or script
    if event_type == 'NEW' and ext in EXECUTABLE_EXTENSIONS:
        return (
            'HIGH',
            f"Unregistered executable/script file '{file_name}' detected. "
            "Forensic Note: New binary or script placed in monitored scope. Does not confirm malicious payload, but unapproved executable requires sandboxing."
        )

    # Rule 5: Generic new file added to directory
    if event_type == 'NEW':
        return (
            'LOW',
            f"New unmonitored file '{file_name}' discovered in monitored folder. "
            "Forensic Note: Routine file creation or unbaselined asset. Baseline registration recommended."
        )

    # Rule 6: Standard file modification
    if event_type == 'MODIFIED':
        return (
            'MEDIUM',
            f"Cryptographic hash mismatch for '{file_name}'. Content has changed since baseline. "
            "Forensic Note: Integrity violation detected. Differentiate between legitimate authorized update and unauthorized modification."
        )

    return ('LOW', f"Informational event observed on '{file_name}'.")
