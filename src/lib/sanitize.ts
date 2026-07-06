const SCRIPT_TAG = /<\/?script[^>]*>/gi;
const ON_EVENT = /\son\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_PROTOCOL = /javascript\s*:/gi;
const DOCUMENT_WRITE = /document\.write\s*\(/gi;

export function stripHtml(value: string): string {
  return value
    .replace(SCRIPT_TAG, "")
    .replace(ON_EVENT, "")
    .replace(JAVASCRIPT_PROTOCOL, "")
    .replace(DOCUMENT_WRITE, "");
}

export function sanitize(value: string): string {
  return stripHtml(value.trim());
}
