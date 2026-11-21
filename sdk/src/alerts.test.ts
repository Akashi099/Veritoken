import { describe, it, expect } from "vitest";
import { isUnusualAmount } from "./alerts.js";

describe("isUnusualAmount — boundary behavior", () => {
  it("flags an amount equal to the configured limit as unusual", () => {
    // amount === maxTransferAmount: 10n * 10n >= 10n * 9n → true
    // Documents that equality is considered unusual (amount is AT the ceiling).
    const limit = 1_000_000n;
    expect(isUnusualAmount(limit, limit)).toBe(true);
  });

  it("flags an amount one unit above the limit as unusual", () => {
    // (limit + 1n) * 10n > limit * 9n → true
    // The next representable bigint above the ceiling is still unusual.
    const limit = 1_000_000n;
    expect(isUnusualAmount(limit + 1n, limit)).toBe(true);
  });

  it("does not flag an amount one unit below the 90% threshold as unusual", () => {
    // threshold = ceil(limit * 9 / 10) = 900_000n for limit = 1_000_000n
    // 899_999n * 10n = 8_999_990n < 1_000_000n * 9n = 9_000_000n → false
    const limit = 1_000_000n;
    const justBelow = 899_999n;
    expect(isUnusualAmount(justBelow, limit)).toBe(false);
  });

  it("flags an amount exactly at the 90% threshold as unusual", () => {
    // 900_000n * 10n = 9_000_000n >= 1_000_000n * 9n = 9_000_000n → true
    const limit = 1_000_000n;
    const threshold = 900_000n;
    expect(isUnusualAmount(threshold, limit)).toBe(true);
  });

  it("returns false when the limit is zero (rule disabled)", () => {
    expect(isUnusualAmount(1_000_000n, 0n)).toBe(false);
  });

  it("returns false when the amount is zero", () => {
    expect(isUnusualAmount(0n, 1_000_000n)).toBe(false);
  });
});
