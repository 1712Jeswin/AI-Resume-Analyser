// Utility formatting helpers

import clsx, {type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

/**
 * Formats a byte size into a human-readable string using KB, MB, or GB.
 * - Uses 1024 base for conversions.
 * - Always returns at least KB (bytes < 1KB are shown as 0 KB).
 * - Uses up to one decimal place and trims trailing .0
 */

export function cn (...inputs:ClassValue[]){
    return twMerge(clsx(inputs))
}


export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 KB";

  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  const trim = (n: number) => {
    const s = n.toFixed(1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };

  if (bytes >= GB) {
    return `${trim(bytes / GB)} GB`;
  }
  if (bytes >= MB) {
    return `${trim(bytes / MB)} MB`;
  }
  // Show as KB for anything less than 1 MB
  return `${trim(bytes / KB)} KB`;
}


export const generateUUID =()=> crypto.randomUUID();

