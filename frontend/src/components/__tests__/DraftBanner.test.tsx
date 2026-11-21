import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DraftBanner, DraftRestoredNotice } from "../DraftBanner";
import DeployPage from "../../pages/DeployPage";
import { useDraftStore, saveDraft, getDraft, DRAFT_FORMAT_VERSION, type DraftEntry } from "../../lib/drafts";

function makeDraft(values: Record<string, unknown> = { name: "Acme Invoice Token" }): DraftEntry {
  const now = Date.now();
  return {
    version: DRAFT_FORMAT_VERSION,
    flow: "deploy:invoice",
    values,
    savedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
  };
}

beforeEach(() => {
  useDraftStore.setState({ drafts: {} });
  localStorage.clear();
});

describe("DraftBanner (issue #1071)", () => {
  it("states that the draft is local and not on-chain", () => {
    render(<DraftBanner draft={makeDraft()} onResume={vi.fn()} onDiscard={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(/saved locally in this browser/i);
    expect(screen.getByRole("status")).toHaveTextContent(/not been submitted on-chain/i);
  });
});

describe("DraftRestoredNotice (issue #1071)", () => {
  it("explains restored values are local draft content and can be dismissed", () => {
    const onDismiss = vi.fn();
    render(<DraftRestoredNotice draft={makeDraft()} onDismiss={onDismiss} />);

    const notice = screen.getByTestId("draft-restored-notice");
    expect(notice).toHaveTextContent(/Draft restored/i);
    expect(notice).toHaveTextContent(/saved locally in this browser/i);
    expect(notice).toHaveTextContent(/not loaded from the contract/i);

    fireEvent.click(screen.getByRole("button", { name: /Dismiss draft restored notice/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("DeployPage draft restoration (issue #1071)", () => {
  it("shows the restored notice after resuming and keeps the draft when dismissed", () => {
    saveDraft("deploy:invoice", { name: "Acme Invoice Token" });
    render(<DeployPage />);

    expect(screen.queryByTestId("draft-restored-notice")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Resume draft/i }));

    expect(screen.getByTestId("draft-restored-notice")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Acme Invoice Token")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Dismiss draft restored notice/i }));

    expect(screen.queryByTestId("draft-restored-notice")).not.toBeInTheDocument();
    // Dismissing the notice must not erase the restored values or the stored draft.
    expect(screen.getByDisplayValue("Acme Invoice Token")).toBeInTheDocument();
    expect(getDraft("deploy:invoice")?.values).toEqual({ name: "Acme Invoice Token" });
  });
});
