import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumberForTable(value: number): string {
  if (typeof value !== 'number') {
    return String(value); // Convert to string if not a number
  }

  const valueString = value.toString();
  const decimalIndex = valueString.indexOf('.');

  if (decimalIndex === -1) {
    return valueString; // No decimal places, return as string
  }

  const decimalPlaces = valueString.length - 1 - decimalIndex;
  const isVerySmall = Math.abs(value) < 0.0001; // Define "very small" threshold

  if (decimalPlaces > 4 && !isVerySmall) {
    return value.toFixed(2);
  }

  return valueString;
}