import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ComplianceConfigIOPage, { ConfigFileExplainer } from "../ComplianceConfigIOPage";
import { ToastProvider } from "../../lib/toast";
import { exportConfig } from "../../lib/complianceConfig";

vi.mock("../../lib/readApi", () => ({
  readApi: {
    complianceSnapshot: vi.fn(),
    policySnapshot: vi.fn(),
  },
}));

vi.mock("../../lib/contracts/index", () => ({ contracts: {} }));

vi.mock("../../components/WalletGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ComplianceConfigIOPage explanatory text (issue #1073)", () => {
  it("renders the file-scope explanation beside the import/export controls", () => {
    render(
      <ToastProvider>
        <ComplianceConfigIOPage />
      </ToastProvider>,
    );
    const explainer = screen.getByTestId("config-file-explainer");
    expect(within(explainer).getByRole("heading", { name: /What the file contains/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download JSON/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select JSON file/i })).toBeInTheDocument();
  });

  it("distinguishes preparing configuration from changing on-chain state", () => {
    render(<ConfigFileExplainer />);
    const explainer = screen.getByTestId("config-file-explainer");
    expect(explainer).toHaveTextContent(/Importing does not activate a policy/i);
    expect(explainer).toHaveTextContent(/no transaction is sent/i);
    expect(explainer).toHaveTextContent(/Save Rules/);
  });

  it("matches the actual export format", () => {
    const cfg = exportConfig(
      {
        max_transfer_amount: 0n,
        min_holding_period: 0n,
        max_holding_period: 0n,
        max_holders: 0,
        require_same_jurisdiction: false,
        paused: false,
        allowlist_mode: false,
      } as never,
      [],
      null,
      { label: "x", network: "testnet" },
    );
    // Every top-level key in the export is described by the explainer.
    expect(Object.keys(cfg).sort()).toEqual(
      ["exportedAt", "label", "network", "riskConfig", "rules", "tierPolicies", "version"].sort(),
    );
    expect(cfg).not.toHaveProperty("blocklist");

    render(<ConfigFileExplainer />);
    const text = screen.getByTestId("config-file-explainer").textContent ?? "";
    for (const phrase of [
      /compliance rules/i,
      /paused flag/i,
      /tier transfer policies/i,
      /risk config/i,
      /export label/i,
      /source network/i,
      /export timestamp/i,
      /format version/i,
      /Blocklisted addresses are not included/i,
    ]) {
      expect(text).toMatch(phrase);
    }
  });
});
