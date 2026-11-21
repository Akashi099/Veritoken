import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReceiptCard } from "../CarbonPage";
import type { RetirementReceipt, ReceiptVerification } from "../../types";

const receipt = {
  retiree: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWX",
  amount: 5n,
  beneficiary: "Acme Corp",
  retirement_reason: "Offset 2026 emissions",
  timestamp: 1_800_000_000,
} as unknown as RetirementReceipt;

const verification = {
  index: 3,
  valid: true,
  retiree: receipt.retiree,
  amount: 5n,
  timestamp: 1_800_000_000,
  project_id: "VCS-1",
  serial: "VCS-1-3",
} as ReceiptVerification;

describe("ReceiptCard receipt action", () => {
  it("labels the action as an on-chain verification, not a copy or download", () => {
    render(<ReceiptCard receipt={receipt} index={3} onVerify={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Verify receipt #3 on-chain" });
    expect(button).toHaveTextContent("Verify on-chain");
    expect(button).not.toHaveTextContent(/download|copy/i);
  });

  it("shows the verification result after the action runs", () => {
    function Harness() {
      const [result, setResult] = useState<ReceiptVerification | undefined>(undefined);
      return (
        <ReceiptCard
          receipt={receipt}
          index={3}
          verification={result}
          onVerify={() => setResult(verification)}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Verify receipt #3 on-chain" }));
    const badge = screen.getByRole("status", { name: "Receipt verified" });
    expect(badge).toHaveTextContent("Verified");
    expect(badge).toHaveTextContent("VCS-1-3");
  });
});
