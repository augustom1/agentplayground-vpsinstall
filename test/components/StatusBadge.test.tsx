import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders healthy status with correct label", () => {
    render(<StatusBadge status="healthy" />);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("renders idle status with correct label", () => {
    render(<StatusBadge status="idle" />);
    expect(screen.getByText("Idle")).toBeInTheDocument();
  });

  it("renders error status with correct label", () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders deploying status with correct label", () => {
    render(<StatusBadge status="deploying" />);
    expect(screen.getByText("Deploying")).toBeInTheDocument();
  });

  it("falls back to idle for unknown status", () => {
    render(<StatusBadge status="unknown-status" />);
    expect(screen.getByText("Idle")).toBeInTheDocument();
  });

  it("applies pulse animation class on healthy status", () => {
    render(<StatusBadge status="healthy" />);
    const dot = document.querySelector(".dot-pulse");
    expect(dot).not.toBeNull();
  });

  it("does not apply pulse animation for non-healthy status", () => {
    render(<StatusBadge status="idle" />);
    const dot = document.querySelector(".dot-pulse");
    expect(dot).toBeNull();
  });
});
