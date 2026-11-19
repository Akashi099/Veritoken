// #1069 Helper text for property share quantities.
//
// The property-token contract mints whole VTPROP tokens (`decimals() == 0`),
// each one share out of the fixed `total_shares`. These tests pin the wording
// to that unit and guard against the hint implying an ownership percentage or
// a currency amount.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PropertyPage, { propertyShareHint } from "../../pages/PropertyPage";
import { ToastProvider } from "../../lib/toast";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("../../lib/wallet", () => ({
  useWallet: () => ({
    connected: true,
    address: "GBQG2SJ7MXUH34SI3MJ2I256I5UMGM2QSQZM77YFX5S6JOHXUQJEPC3A",
    signTx: vi.fn(),
  }),
}));

vi.mock("../../lib/stellar", () => ({
  CONTRACT_IDS: { propertyToken: "CTEST456" },
  fetchContractEvents: vi.fn().mockResolvedValue([]),
  server: {
    simulateTransaction: vi.fn().mockRejectedValue(new Error("sim error")),
  },
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
}));

vi.mock("../../lib/contracts/index", () => ({
  contracts: {
    property: {
      getMeta: vi.fn().mockResolvedValue({
        property_id: "PROP-001",
        legal_name: "Test Property LLC",
        jurisdiction: "US",
        address: "123 Test St",
        total_valuation_usd: 1000000n,
        total_shares: 1000n,
        property_type: "residential",
        kyc_tier_required: 1,
        ipfs_title_hash: "",
      }),
      totalShares: vi.fn().mockResolvedValue(1000n),
      pendingDividend: vi.fn().mockResolvedValue(0n),
      holderCount: vi.fn().mockResolvedValue(5),
      holderSlotsRemaining: vi.fn().mockResolvedValue(95),
      mint: vi.fn().mockResolvedValue(undefined),
      depositDividend: vi.fn().mockResolvedValue(undefined),
      claimDividend: vi.fn().mockResolvedValue(100n),
      dividendDepositCount: vi.fn().mockResolvedValue(0),
      getDividendHistory: vi.fn().mockResolvedValue([]),
    },
    compliance: {
      getLockupStatus: vi.fn().mockResolvedValue({
        locked: false,
        unlock_ledger: 0,
      }),
    },
  },
}));

vi.mock("../../components/WalletGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderPropertyPage() {
  return render(
    <ToastProvider>
      <PropertyPage />
    </ToastProvider>,
  );
}

// The mint tab is the page's default tab, so no tab click is needed; "Mint
// Shares" also names the submit button, which would make a role query ambiguous.
async function openMintTab() {
  renderPropertyPage();
  return (await screen.findByLabelText(/Shares to Mint/i)) as HTMLInputElement;
}

// ── Wording ───────────────────────────────────────────────────────────────────

describe("propertyShareHint – wording", () => {
  it("names the contract unit: whole VTPROP tokens with no decimals", () => {
    const hint = propertyShareHint(1000n);
    expect(hint).toContain("VTPROP");
    expect(hint).toContain("no decimals");
    expect(hint).toMatch(/whole/i);
  });

  it("states the 1 token = 1 share relationship the contract defines", () => {
    expect(propertyShareHint(1000n)).toMatch(/Each token is 1 share/i);
  });

  it("includes the total share supply, thousands-formatted", () => {
    expect(propertyShareHint(1000n)).toContain("of the 1,000 total shares");
    expect(propertyShareHint(25000)).toContain("of the 25,000 total shares");
  });

  it("falls back to generic supply wording when total shares are unknown", () => {
    const hint = propertyShareHint(null);
    expect(hint).toContain("fixed total shares");
    expect(hint).not.toMatch(/undefined|NaN|null/);
  });

  it("does not assert an ownership percentage or a currency amount", () => {
    for (const hint of [propertyShareHint(1000n), propertyShareHint(null)]) {
      // No percent figure, and no claim that N tokens equal N% of the asset.
      expect(hint).not.toMatch(/%/);
      expect(hint).not.toMatch(/\bown(s|ership)?\s+\d/i);
      expect(hint).not.toMatch(/\$\d/);
      // Instead it explicitly disclaims both readings.
      expect(hint).toMatch(/not a percentage/i);
      expect(hint).toMatch(/not a percentage or a USD amount/i);
    }
  });
});

// ── Rendering & accessibility wiring ──────────────────────────────────────────

describe("PropertyPage – share quantity hint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hint beside the share quantity field", async () => {
    await openMintTab();
    expect(
      await screen.findByText(/Number of whole VTPROP tokens to mint/i),
    ).toBeDefined();
  });

  it("uses the loaded total share supply in the rendered hint", async () => {
    await openMintTab();
    await waitFor(() => {
      expect(
        screen.getByText(/of the 1,000 total shares/i),
      ).toBeDefined();
    });
  });

  it("associates the hint with the input via aria-describedby", async () => {
    const sharesInput = await openMintTab();
    await waitFor(() => {
      const ids = (sharesInput.getAttribute("aria-describedby") ?? "").split(
        /\s+/,
      );
      const described = ids
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ");
      expect(described).toMatch(/Number of whole VTPROP tokens to mint/i);
    });
  });

  it("keeps both the hint and the validation error described when input is invalid", async () => {
    const sharesInput = await openMintTab();
    fireEvent.change(sharesInput, { target: { value: "-50" } });
    fireEvent.blur(sharesInput);

    await waitFor(() => {
      const ids = (sharesInput.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter(Boolean);
      const nodes = ids.map((id) => document.getElementById(id));
      expect(nodes.every((n) => n !== null)).toBe(true);
      expect(nodes.some((n) => n?.getAttribute("role") === "alert")).toBe(true);
      expect(
        nodes.map((n) => n?.textContent ?? "").join(" "),
      ).toMatch(/Number of whole VTPROP tokens to mint/i);
    });
  });
});
