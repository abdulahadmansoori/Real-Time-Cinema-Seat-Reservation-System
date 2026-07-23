import { describe, it, expect } from "vitest";
import { buildPageMeta } from "@cinema/shared";

describe("buildPageMeta", () => {
  it("computes pagination meta", () => {
    const meta = buildPageMeta(2, 20, 55);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
  });

  it("handles empty results", () => {
    const meta = buildPageMeta(1, 20, 0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
  });
});
