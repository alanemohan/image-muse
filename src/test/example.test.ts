import { describe, it, expect } from "vitest";

describe("test environment", () => {
  it("runs vitest correctly", () => {
    expect(true).toBe(true);
  });

  it("has a DOM environment", () => {
    const div = document.createElement("div");
    div.textContent = "hello";
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
  });
});
