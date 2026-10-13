import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combinar clases de Tailwind CSS con clsx y tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validar que un valor no sea nulo o undefined
 */
export function assertNotNullish<T>(value: T | null | undefined, message?: string): T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "Expected value to be not null or undefined");
  }
  return value;
}

/**
 * Validar que un valor sea un número positivo
 */
export function assertPositiveNumber(value: number, message?: string): void {
  if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
    throw new Error(message ?? "Expected a valid positive number");
  }
}

/**
 * Validar que un valor sea un número no negativo (puede ser cero)
 */
export function assertNonNegativeNumber(value: number, message?: string): void {
  if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
    throw new Error(message ?? "Expected a valid non-negative number");
  }
}

/**
 * Validar que una cadena no esté vacía
 */
export function assertNonEmptyString(value: string, message?: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(message ?? "Expected a non-empty string");
  }
}
