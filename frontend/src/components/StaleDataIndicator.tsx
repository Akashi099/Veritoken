/**
 * StaleDataIndicator — Issue #1067
 *
 * Small freshness cue for cards that render contract reads through
 * React Query. It reuses the state React Query already tracks (no new
 * polling): when the latest refetch failed or is paused offline while the
 * card is still showing the last successful read, the data is labelled as
 * cached rather than live.
 */

export interface QueryFreshnessInput {
  /** True when data from a previous successful read is available. */
  hasData: boolean;
  /** React Query: the most recent refetch failed but cached data is kept. */
  isRefetchError?: boolean;
  /** React Query: the fetch is paused (e.g. the browser is offline). */
  isPaused?: boolean;
  /** React Query: epoch ms of the last successful read (0 when none). */
  dataUpdatedAt?: number;
}

export interface QueryFreshness {
  isStale: boolean;
  lastUpdatedAt: number | null;
}

/**
 * Derives whether the displayed contract data is a cached value rather than
 * a confirmed latest read.
 */
export function getQueryFreshness({
  hasData,
  isRefetchError = false,
  isPaused = false,
  dataUpdatedAt = 0,
}: QueryFreshnessInput): QueryFreshness {
  return {
    isStale: hasData && (isRefetchError || isPaused),
    lastUpdatedAt: dataUpdatedAt > 0 ? dataUpdatedAt : null,
  };
}

interface Props extends QueryFreshness {
  /** Optional retry handler (e.g. React Query's `refetch`). */
  onRetry?: () => void;
}

export function StaleDataIndicator({ isStale, lastUpdatedAt, onRetry }: Props) {
  if (!isStale) return null;

  const when = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : null;
  const label = when
    ? `Cached data from ${when}. The latest contract read failed, so these values may not be current.`
    : "Cached data. The latest contract read failed, so these values may not be current.";

  return (
    <div
      role="status"
      data-testid="stale-data-indicator"
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
        padding: "0.35rem 0.65rem",
        marginBottom: "0.75rem",
        borderRadius: 8,
        fontSize: "0.75rem",
        color: "#d97706",
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.35)",
      }}
    >
      <span aria-hidden="true">⚠</span>
      <span>
        <strong>Cached</strong>
        {when ? ` · last updated ${when}` : ""}
        <span className="sr-only"> — the latest contract read failed, so these values may not be current.</span>
      </span>
      {onRetry && (
        <button
          type="button"
          className="btn-ghost"
          onClick={onRetry}
          style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", marginLeft: "auto" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default StaleDataIndicator;
