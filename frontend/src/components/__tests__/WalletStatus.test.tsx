import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WalletStatus } from "../WalletStatus";

// Keep the selector's own interaction out of scope: stub it with a single
// connect control so we can drive the pending state.
vi.mock("../WalletSelectorModal", () => ({
  default: ({ onSelect }: { onSelect: (type: string) => void }) => (
    <button type="button" onClick={() => onSelect("freighter")}>
      Connect Freighter
    </button>
  ),
}));

vi.mock("../../lib/stellar", () => ({ NETWORK_PASSPHRASE: "Test SDF Network ; September 2015" }));

const walletState = {
  connected: false,
  selectProvider: vi.fn(),
};

vi.mock("../../lib/wallet", () => ({
  useWallet: Object.assign(() => walletState, { setState: vi.fn() }),
}));

import WalletGuard from "../WalletGuard";

describe("WalletStatus (issue #1072)", () => {
  it("exposes a connected label and hides the decorative dot", () => {
    const { container } = render(<WalletStatus status="connected" />);
    expect(screen.getByText("Wallet connected")).toBeInTheDocument();
    expect(screen.getByText("Wallet connected")).toHaveClass("sr-only");
    expect(container.querySelector(".dot")).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes a disconnected label without relying on a dot", () => {
    const { container } = render(<WalletStatus status="disconnected" visibleLabel />);
    expect(screen.getByText("Wallet not connected")).not.toHaveClass("sr-only");
    expect(container.querySelector(".dot")).toBeNull();
  });
});

describe("WalletGuard status text (issue #1072)", () => {
  beforeEach(() => {
    walletState.connected = false;
    walletState.selectProvider = vi.fn();
  });

  it("announces the disconnected state as text", () => {
    render(
      <WalletGuard>
        <p>Protected</p>
      </WalletGuard>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Wallet not connected");
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("announces the pending state while connecting, leaving selection unchanged", async () => {
    let resolve!: () => void;
    walletState.selectProvider = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(
      <WalletGuard>
        <p>Protected</p>
      </WalletGuard>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect Freighter" }));
    expect(walletState.selectProvider).toHaveBeenCalledWith("freighter");
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Connecting wallet…");
    });

    resolve();
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Wallet not connected");
    });
  });

  it("renders children without the status line once connected", () => {
    walletState.connected = true;
    render(
      <WalletGuard>
        <p>Protected</p>
      </WalletGuard>,
    );
    expect(screen.getByText("Protected")).toBeInTheDocument();
    expect(screen.queryByText("Wallet not connected")).not.toBeInTheDocument();
  });
});
