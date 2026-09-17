"""
hashing.py
Cryptographic SHA-256 calculation module for file integrity verification.
"""

import hashlib
import os

CHUNK_SIZE = 65536  # Read in 64KB blocks for memory efficiency with large files

def calculate_sha256(file_path):
    """
    Computes the SHA-256 cryptographic hash of a given file.
    Returns:
        str: 64-character hexadecimal SHA-256 digest, or None if file cannot be read.
    """
    if not os.path.isfile(file_path):
        return None

    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            while True:
                data = f.read(CHUNK_SIZE)
                if not data:
                    break
                sha256_hash.update(data)
        return sha256_hash.hexdigest()
    except (PermissionError, OSError) as err:
        print(f"[!] Warning: Cannot read {file_path}: {err}")
        return None

def verify_integrity(baseline_hash, current_hash):
    """
    Compares baseline hash and current hash.
    Returns True if intact, False if modified.
    """
    if not baseline_hash or not current_hash:
        return False
    return baseline_hash.strip().lower() == current_hash.strip().lower()
