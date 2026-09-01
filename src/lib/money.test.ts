import { describe, expect, it } from "vitest";
import { discountPercent, formatCentsToBRL } from "./money";

describe("formatCentsToBRL", () => {
  it("formats cents as BRL currency", () => {
    expect(formatCentsToBRL(8990)).toBe("R$ 89,90");
  });

  it("formats zero correctly", () => {
    expect(formatCentsToBRL(0)).toBe("R$ 0,00");
  });
});

describe("discountPercent", () => {
  it("returns null when there is no compareAtPrice", () => {
    expect(discountPercent(1000, null)).toBeNull();
  });

  it("returns null when compareAtPrice is not higher than price", () => {
    expect(discountPercent(1000, 900)).toBeNull();
  });

  it("computes the rounded discount percentage", () => {
    expect(discountPercent(8990, 12990)).toBe(31);
  });
});
