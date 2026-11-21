import { useNetworkStore } from "../lib/networkStore";

/**
 * Plain-text label for the network currently selected in the app store.
 * Shown near transaction actions so users can see which network they sign for.
 */
export function NetworkIndicator() {
  const network = useNetworkStore((s) => s.network);
  const label = network === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <p
      data-testid="active-network"
      style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--text, inherit)" }}
    >
      <span style={{ fontWeight: 600 }}>Network:</span> {label}
    </p>
  );
}
