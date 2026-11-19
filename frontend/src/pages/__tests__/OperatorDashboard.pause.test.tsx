import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PauseBadge, describePauseState } from "../OperatorDashboard";

describe("PauseBadge", () => {
  it("shows explicit text and an accessible description when paused", () => {
    render(<PauseBadge paused={true} subject="Compliance Engine" />);
    const badge = screen.getByRole("status", {
      name: "Compliance Engine pause status: paused — operations are halted",
    });
    expect(badge).toHaveTextContent("Paused");
    expect(badge).toHaveAttribute("data-pause-state", "paused");
  });

  it("shows explicit text and an accessible description when active", () => {
    render(<PauseBadge paused={false} subject="Compliance Engine" />);
    const badge = screen.getByRole("status", {
      name: "Compliance Engine pause status: active — operations are running",
    });
    expect(badge).toHaveTextContent("Active");
    expect(badge).not.toHaveTextContent("Paused");
    expect(badge).toHaveAttribute("data-pause-state", "active");
  });

  it("labels the unknown state with text rather than a bare dash", () => {
    render(<PauseBadge paused={null} />);
    const badge = screen.getByRole("status", { name: describePauseState(null) });
    expect(badge).toHaveTextContent("Unknown");
  });
});
