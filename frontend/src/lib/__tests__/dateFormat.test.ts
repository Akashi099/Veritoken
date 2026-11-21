import { describe, it, expect } from "vitest";
import { formatKycExpiry, NO_EXPIRY_LABEL } from "../dateFormat";

describe("formatKycExpiry", () => {
  it("formats a real timestamp as a date", () => {
    // 2027-03-04T12:00:00Z
    const ts = Date.UTC(2027, 2, 4, 12) / 1000;
    expect(formatKycExpiry(ts, "en-US")).toBe("Mar 4, 2027");
  });

  it("accepts bigint timestamps", () => {
    const ts = BigInt(Date.UTC(2027, 2, 4, 12) / 1000);
    expect(formatKycExpiry(ts, "en-US")).toBe("Mar 4, 2027");
  });

  it("renders zero as no expiry rather than the epoch", () => {
    expect(formatKycExpiry(0)).toBe(NO_EXPIRY_LABEL);
    expect(formatKycExpiry(0n)).toBe(NO_EXPIRY_LABEL);
    expect(formatKycExpiry(0, "en-US")).not.toMatch(/1970/);
  });
});
