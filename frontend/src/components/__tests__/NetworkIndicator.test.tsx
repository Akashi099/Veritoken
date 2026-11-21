import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NetworkIndicator } from "../NetworkIndicator";
import { useNetworkStore } from "../../lib/networkStore";
import ConfirmDialog from "../ConfirmDialog";

beforeEach(() => {
  useNetworkStore.setState({ network: "testnet" });
});

describe("NetworkIndicator", () => {
  it("shows the built-in testnet network", () => {
    render(<NetworkIndicator />);
    expect(screen.getByTestId("active-network").textContent).toContain("Testnet");
  });

  it("shows mainnet when mainnet is selected", () => {
    useNetworkStore.setState({ network: "mainnet" });
    render(<NetworkIndicator />);
    expect(screen.getByTestId("active-network").textContent).toContain("Mainnet");
  });

  it("is shown in a confirmation dialog only when requested", () => {
    const { unmount } = render(
      <ConfirmDialog title="T" description="D" onConfirm={() => {}} onCancel={() => {}} showNetwork />,
    );
    expect(screen.getByText(/Network:/)).toBeDefined();
    unmount();

    render(<ConfirmDialog title="T" description="D" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText(/Network:/)).toBeNull();
  });
});
