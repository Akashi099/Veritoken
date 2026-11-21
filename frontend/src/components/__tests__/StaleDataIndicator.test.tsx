import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { StaleDataIndicator, getQueryFreshness } from "../StaleDataIndicator";

describe("getQueryFreshness", () => {
  it("is fresh when the latest read succeeded", () => {
    expect(
      getQueryFreshness({ hasData: true, isRefetchError: false, isPaused: false, dataUpdatedAt: 1000 }),
    ).toEqual({ isStale: false, lastUpdatedAt: 1000 });
  });

  it("is stale when a refetch failed and cached data is shown", () => {
    expect(getQueryFreshness({ hasData: true, isRefetchError: true, dataUpdatedAt: 1000 }).isStale).toBe(true);
  });

  it("is stale when the fetch is paused offline with cached data", () => {
    expect(getQueryFreshness({ hasData: true, isPaused: true }).isStale).toBe(true);
  });

  it("is never stale without cached data", () => {
    expect(getQueryFreshness({ hasData: false, isRefetchError: true, isPaused: true }).isStale).toBe(false);
  });

  it("reports no timestamp when none is known", () => {
    expect(getQueryFreshness({ hasData: true, dataUpdatedAt: 0 }).lastUpdatedAt).toBeNull();
  });
});

describe("StaleDataIndicator", () => {
  it("renders nothing for fresh data", () => {
    render(<StaleDataIndicator isStale={false} lastUpdatedAt={Date.now()} />);
    expect(screen.queryByTestId("stale-data-indicator")).not.toBeInTheDocument();
  });

  it("labels stale data as cached with the last update time", () => {
    const ts = new Date("2026-01-02T03:04:05Z").getTime();
    render(<StaleDataIndicator isStale lastUpdatedAt={ts} />);
    const indicator = screen.getByTestId("stale-data-indicator");
    expect(indicator).toHaveAttribute("role", "status");
    expect(indicator).toHaveTextContent(/Cached/);
    expect(indicator).toHaveTextContent(new Date(ts).toLocaleString());
    expect(indicator).toHaveTextContent(/may not be current/i);
    expect(indicator).not.toHaveTextContent(/live/i);
  });
});

// ── Integration with a real React Query cache ────────────────────────────────

function ContractValueCard({ fetcher }: { fetcher: () => Promise<string> }) {
  const { data, isRefetchError, isPaused, dataUpdatedAt } = useQuery({
    queryKey: ["contract-value"],
    queryFn: fetcher,
    retry: false,
  });
  return (
    <div>
      <StaleDataIndicator
        {...getQueryFreshness({ hasData: data !== undefined, isRefetchError, isPaused, dataUpdatedAt })}
      />
      <span data-testid="value">{data ?? "—"}</span>
    </div>
  );
}

describe("StaleDataIndicator with React Query", () => {
  it("is absent after a fresh read and present after a failed refetch", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const fetcher = vi
      .fn<[], Promise<string>>()
      .mockResolvedValueOnce("1,000")
      .mockRejectedValueOnce(new Error("Network unreachable"));

    render(<ContractValueCard fetcher={fetcher} />, { wrapper });

    await waitFor(() => expect(screen.getByTestId("value")).toHaveTextContent("1,000"));
    expect(screen.queryByTestId("stale-data-indicator")).not.toBeInTheDocument();

    await act(async () => {
      await qc.refetchQueries({ queryKey: ["contract-value"] });
    });

    await waitFor(() => expect(screen.getByTestId("stale-data-indicator")).toBeInTheDocument());
    // The last successful value is still displayed, but labelled as cached.
    expect(screen.getByTestId("value")).toHaveTextContent("1,000");
  });
});
