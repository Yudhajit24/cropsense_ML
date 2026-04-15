/**
 * useExport.ts — Hook to export prediction results as JSON or CSV.
 *
 * Wires up the "Export" button in the toolbar. Downloads a file
 * containing the current prediction result set.
 */

import { useCallback } from 'react';

/**
 * Trigger a file download in the browser.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert a flat object to a single-row CSV string.
 */
function objectToCSV(obj: Record<string, unknown>): string {
  const flat = flattenObject(obj);
  const headers = Object.keys(flat).join(',');
  const values = Object.values(flat)
    .map((v) => (typeof v === 'string' ? `"${v}"` : String(v)))
    .join(',');
  return `${headers}\n${values}`;
}

/**
 * Flatten nested objects into dot-notation keys.
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

/**
 * Hook returning export functions for the current prediction result.
 */
export function useExport(data: Record<string, unknown> | null) {
  const exportJSON = useCallback(() => {
    if (!data) return;
    const json = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadFile(json, `cropsense-result-${timestamp}.json`, 'application/json');
  }, [data]);

  const exportCSV = useCallback(() => {
    if (!data) return;
    const csv = objectToCSV(data);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadFile(csv, `cropsense-result-${timestamp}.csv`, 'text/csv');
  }, [data]);

  return { exportJSON, exportCSV, hasData: !!data };
}
