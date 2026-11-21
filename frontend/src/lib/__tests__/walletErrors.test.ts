import { describe, it, expect } from "vitest";
import { describeWalletError } from "../walletErrors";

describe("describeWalletError", () => {
  it("gives install guidance when the provider is missing", () => {
    const msg = describeWalletError(
      new Error("Freighter is not installed. Install it from freighter.app."),
    );
    expect(msg).toMatch(/isn't available in your browser/i);
    expect(msg).not.toMatch(/freighter\.app/);
  });

  it("gives approval guidance when the user rejects the request", () => {
    const msg = describeWalletError(new Error("User rejected the request"));
    expect(msg).toMatch(/declined or cancelled/i);
  });

  it("does not expose unrecognised internal error text", () => {
    const msg = describeWalletError(new Error("TypeError: cannot read properties of undefined"));
    expect(msg).not.toMatch(/TypeError/);
    expect(msg).toMatch(/Could not connect/i);
  });

  it("handles non-Error values with the generic message", () => {
    expect(describeWalletError(undefined)).toMatch(/Could not connect/i);
  });
});
