import Decimal from "decimal.js";

/**
 * Formatear número como moneda (por defecto CRC - Colones costarricenses)
 */
export function formatCurrency(
  amount: number | string | Decimal,
  options?: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  try {
    const decimalAmount = new Decimal(amount || 0);
    const curr = options?.currency || "CRC";

    // Mapeo amigable para es-CR o formato general
    return new Intl.NumberFormat(curr === "CRC" ? "es-CR" : "en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(decimalAmount.toNumber());
  } catch {
    return `${options?.currency || "CRC"} ${amount}`;
  }
}

/**
 * Formatear número con decimales configurables
 */
export function formatNumber(
  amount: number | string | Decimal,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  try {
    const decimalAmount = new Decimal(amount || 0);
    
    return new Intl.NumberFormat("es-CR", {
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(decimalAmount.toNumber());
  } catch {
    return String(amount);
  }
}

/**
 * Redondear a decimales específicos
 */
export function roundToDecimal(value: number | string | Decimal, decimals: number): string {
  const decimalAmount = new Decimal(value || 0);
  return decimalAmount.toFixed(decimals);
}

/**
 * Sumar valores con precisión decimal
 */
export function sumValues(values: (number | string | Decimal)[]): string {
  return values
    .reduce<Decimal>((acc, val) => acc.plus(new Decimal(val || 0)), new Decimal(0))
    .toString();
}

/**
 * Multiplicar valores con precisión decimal
 */
export function multiplyValues(values: (number | string | Decimal)[]): string {
  return values
    .reduce<Decimal>((acc, val) => acc.times(new Decimal(val || 0)), new Decimal(1))
    .toString();
}
