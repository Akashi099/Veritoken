/**
 * Maps wallet connection failures to short, user-safe guidance.
 *
 * The raw error is not shown to the user: library and transport messages can
 * contain internal details. Callers should log the original error for
 * developers before displaying the result of this function.
 */
export function describeWalletError(err: unknown): string {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  // Wallet or transport is missing or unsupported in this browser.
  if (/not installed|requires a (Chromium|browser)|not supported in this environment/i.test(msg)) {
    return "This wallet isn't available in your browser. Install or enable the wallet extension, then try again.";
  }

  // Ledger app not open on the device.
  if (/Stellar app/i.test(msg)) {
    return "Open the Stellar app on your Ledger device, then try again.";
  }

  // User dismissed or refused the request in the wallet or device picker.
  if (/reject|declin|denied|cancel/i.test(msg)) {
    return "The connection request was declined or cancelled. Approve the request in your wallet to continue.";
  }

  if (/expired/i.test(msg)) {
    return "Your wallet session expired. Please reconnect your wallet.";
  }

  return "Could not connect to your wallet. Make sure it is unlocked and try again.";
}
