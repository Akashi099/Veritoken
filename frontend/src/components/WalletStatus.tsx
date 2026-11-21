/**
 * WalletStatus — Issue #1072
 *
 * Text alternative for the wallet connection indicator. The status dot (or any
 * colour cue) is decorative and hidden from assistive technology; the state is
 * always conveyed as text, either visibly or via the existing `.sr-only`
 * utility, so it can be understood without interpreting colour or icon shape.
 */

export type WalletConnectionStatus = "connected" | "disconnected" | "pending";

export const WALLET_STATUS_LABELS: Record<WalletConnectionStatus, string> = {
  connected: "Wallet connected",
  disconnected: "Wallet not connected",
  pending: "Connecting wallet…",
};

interface WalletStatusProps {
  status: WalletConnectionStatus;
  /** Render the label visibly next to the indicator instead of screen-reader-only. */
  visibleLabel?: boolean;
  /** Show the decorative status dot (connected state only). */
  showDot?: boolean;
}

export function WalletStatus({ status, visibleLabel = false, showDot = true }: WalletStatusProps) {
  const label = WALLET_STATUS_LABELS[status];
  return (
    <span data-testid="wallet-status" data-status={status} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
      {showDot && status === "connected" && <span className="dot" aria-hidden="true" />}
      <span className={visibleLabel ? undefined : "sr-only"}>{label}</span>
    </span>
  );
}
