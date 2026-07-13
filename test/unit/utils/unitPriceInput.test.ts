import { describe, expect, it } from "vitest";
import {
  finalizeUnitPriceInput,
  isInProgressUnitPriceInput,
  normalizeUnitPriceDraftInput,
} from "~/utils/unitPriceInput";

describe("unitPriceInput", () => {
  it("detects in-progress decimal entry", () => {
    expect(isInProgressUnitPriceInput("12.")).toBe(true);
    expect(isInProgressUnitPriceInput(".")).toBe(true);
    expect(isInProgressUnitPriceInput("12.1")).toBe(false);
  });

  it("normalizes values and limits decimal places", () => {
    expect(normalizeUnitPriceDraftInput("12.3456")).toBe("12.34");
    expect(normalizeUnitPriceDraftInput("99")).toBe("99");
    expect(normalizeUnitPriceDraftInput(".75")).toBe(".75");
    expect(normalizeUnitPriceDraftInput("")).toBe("");
    expect(normalizeUnitPriceDraftInput("abc", "10")).toBe("10");
  });

  it("preserves trailing decimal when the control coerces to a number", () => {
    expect(normalizeUnitPriceDraftInput("12.")).toBe("12.");
    expect(normalizeUnitPriceDraftInput(12, "12.")).toBe("12.");
  });

  it("finalizes trailing decimal on blur", () => {
    expect(finalizeUnitPriceInput("12.")).toBe("12");
    expect(finalizeUnitPriceInput("12.11")).toBe("12.11");
  });
});
