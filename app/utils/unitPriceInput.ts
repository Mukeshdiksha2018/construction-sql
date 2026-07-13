export function toUnitPriceInputString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "number" ? String(value) : String(value);
}

/** True while the user is mid-entry, e.g. "." or "12." */
export function isInProgressUnitPriceInput(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "." || /^-?\d+\.$/.test(trimmed);
}

/**
 * Normalize unit price draft text for currency inputs.
 * Preserves in-progress decimals (e.g. "12.") when the control coerces to number 12.
 */
export function normalizeUnitPriceDraftInput(
  value: unknown,
  previousInput = "",
): string {
  const incomingString = toUnitPriceInputString(value).replace(/,/g, "").trim();

  if (typeof value === "number" && isInProgressUnitPriceInput(previousInput)) {
    const prevBase = previousInput.endsWith(".")
      ? previousInput.slice(0, -1)
      : previousInput;
    if (String(value) === prevBase) {
      return previousInput;
    }
  }

  if (!incomingString) return "";
  if (!/^\d*\.?\d*$/.test(incomingString)) return previousInput || "";

  const parts = incomingString.split(".");
  const integerPart = parts[0] ?? "";
  const decimalPart = parts[1] ?? "";
  if (!incomingString.includes(".")) return integerPart;
  return `${integerPart}.${decimalPart.slice(0, 2)}`;
}

/** Strip a trailing decimal separator on blur so commits use a numeric value. */
export function finalizeUnitPriceInput(value: string): string {
  const normalized = normalizeUnitPriceDraftInput(value);
  if (isInProgressUnitPriceInput(normalized)) {
    return normalized.replace(/\.$/, "") || "";
  }
  return normalized;
}
