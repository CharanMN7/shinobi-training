import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKg(value: number | string | null | undefined, decimals = 1): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "—";
  return `${n.toFixed(decimals)} kg`;
}

export function formatPct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatPace(distanceKm: number, durationMin: number): string {
  if (distanceKm <= 0) return "—";
  const paceMinPerKm = durationMin / distanceKm;
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

export function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}
