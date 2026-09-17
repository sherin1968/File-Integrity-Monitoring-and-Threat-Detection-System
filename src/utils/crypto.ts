/**
 * Computes the real cryptographic SHA-256 hexadecimal hash using the Web Crypto API.
 */
export async function computeSHA256(textOrBuffer: string | ArrayBuffer): Promise<string> {
  const data = typeof textOrBuffer === 'string'
    ? new TextEncoder().encode(textOrBuffer)
    : textOrBuffer;

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Formats a 64-char SHA-256 string with truncation for compact display.
 */
export function truncateHash(hash: string, start = 8, end = 8): string {
  if (!hash || hash.length <= start + end) return hash || 'N/A';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

/**
 * Format bytes to readable string (e.g. 1.2 KB, 540 B)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
