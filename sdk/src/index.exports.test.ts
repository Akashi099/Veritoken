import { describe, it, expect } from "vitest";
// Import through the package entry point, not a private module path, so the
// test fails if the alert helpers stop being reachable by integrations.
import { alertForUnusualAmount } from "./index.js";
import type { Alert } from "./index.js";

const ADDRESS = "GBQG2SJ7MXUH34SI3MJ2I256I5UMGM2QSQZM77YFX5S6JOHXUQJEPC3A";

describe("package entry point — alert helper exports (#1077)", () => {
  it("exposes alertForUnusualAmount as a runtime helper", () => {
    expect(typeof alertForUnusualAmount).toBe("function");

    const alert: Alert = alertForUnusualAmount({
      address: ADDRESS,
      amount: 950n,
      maxTransferAmount: 1000n,
      txHash: "abc123",
    });

    expect(alert.severity).toBe("warning");
    expect(alert.category).toBe("unusual_amount");
    expect(alert.address).toBe(ADDRESS);
    expect(alert.txHash).toBe("abc123");
  });
});
