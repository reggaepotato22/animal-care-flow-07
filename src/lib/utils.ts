import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePatientId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit random number
  return `P-${year}-${randomNum}`;
}
