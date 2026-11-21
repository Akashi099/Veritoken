/**
 * Shared date formatting helpers.
 *
 * KYC expiry values are Unix timestamps in seconds. The KYC registry contract
 * defines `0` as "no expiry", so that value must never be rendered as the
 * Unix epoch (1 Jan 1970).
 */

/** Label shown wherever a KYC record has no expiry (`expiry == 0`). */
export const NO_EXPIRY_LABEL = "No expiry";

/** Formatting options used for every KYC expiry display. */
const KYC_EXPIRY_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

/**
 * Format a KYC expiry timestamp (seconds) for display.
 *
 * Returns {@link NO_EXPIRY_LABEL} for `0` (or any non-positive / non-finite
 * value), otherwise a consistent locale date such as "Mar 4, 2027".
 */
export function formatKycExpiry(
  expiry: number | bigint,
  locale?: string | string[],
): string {
  const seconds = typeof expiry === "bigint" ? Number(expiry) : expiry;
  if (!Number.isFinite(seconds) || seconds <= 0) return NO_EXPIRY_LABEL;
  return new Date(seconds * 1000).toLocaleDateString(locale, KYC_EXPIRY_FORMAT);
}
