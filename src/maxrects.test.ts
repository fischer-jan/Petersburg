import { describe, it, expect } from "vitest";
import { pack } from "./maxrects";

describe("pack", () => {
  describe("basic packing", () => {
    it("places a single item at origin", () => {
      const items = [{ id: "a", width: 100, height: 50 }];
      const result = pack(items, 500);

      expect(result.placements).toHaveLength(1);
      expect(result.placements[0]).toEqual({
        id: "a",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      });
      expect(result.totalHeight).toBe(50);
    });

    it("places items side by side when they fit", () => {
      const items = [
        { id: "a", width: 100, height: 50 },
        { id: "b", width: 100, height: 50 },
      ];
      const result = pack(items, 500);

      expect(result.placements).toHaveLength(2);
      // Both should be at y=0
      expect(result.placements.find((p) => p.id === "a")?.y).toBe(0);
      expect(result.placements.find((p) => p.id === "b")?.y).toBe(0);
      expect(result.totalHeight).toBe(50);
    });

    it("wraps to next row when width exceeded", () => {
      const items = [
        { id: "a", width: 300, height: 100 },
        { id: "b", width: 300, height: 100 },
      ];
      const result = pack(items, 500);

      expect(result.placements).toHaveLength(2);
      const placementA = result.placements.find((p) => p.id === "a");
      const placementB = result.placements.find((p) => p.id === "b");

      // One at y=0, one below
      expect(placementA?.y).toBe(0);
      expect(placementB?.y).toBeGreaterThan(0);
    });

    it("returns empty placements for empty input", () => {
      const result = pack([], 500);
      expect(result.placements).toHaveLength(0);
      expect(result.totalHeight).toBe(0);
    });
  });

  describe("gap handling", () => {
    it("adds gap between items horizontally", () => {
      const items = [
        { id: "a", width: 100, height: 50 },
        { id: "b", width: 100, height: 50 },
      ];
      const result = pack(items, 500, 10);

      const placementA = result.placements.find((p) => p.id === "a");
      const placementB = result.placements.find((p) => p.id === "b");

      expect(placementA?.x).toBe(0);
      // B should start after A's width + gap
      expect(placementB?.x).toBe(110);
    });

    it("adds gap between items vertically", () => {
      const items = [
        { id: "a", width: 400, height: 100 },
        { id: "b", width: 400, height: 100 },
      ];
      const result = pack(items, 500, 10);

      const placementA = result.placements.find((p) => p.id === "a");
      const placementB = result.placements.find((p) => p.id === "b");

      expect(placementA?.y).toBe(0);
      expect(placementB?.y).toBe(110);
    });
  });

  describe("sort strategies", () => {
    it("maintains input order with 'none' strategy", () => {
      const items = [
        { id: "small", width: 100, height: 50 },
        { id: "large", width: 100, height: 200 },
        { id: "medium", width: 100, height: 100 },
      ];
      const result = pack(items, 500, 0, "none");

      // All should fit on first row, maintaining input order
      const positions = result.placements.map((p) => ({ id: p.id, x: p.x }));
      positions.sort((a, b) => a.x - b.x);

      expect(positions[0].id).toBe("small");
      expect(positions[1].id).toBe("large");
      expect(positions[2].id).toBe("medium");
    });

    it("sorts by height descending with 'height-desc' strategy", () => {
      const items = [
        { id: "small", width: 100, height: 50 },
        { id: "large", width: 100, height: 200 },
        { id: "medium", width: 100, height: 100 },
      ];
      const result = pack(items, 500, 0, "height-desc");

      // Largest should be placed first (leftmost)
      const positions = result.placements.map((p) => ({ id: p.id, x: p.x }));
      positions.sort((a, b) => a.x - b.x);

      expect(positions[0].id).toBe("large");
      expect(positions[1].id).toBe("medium");
      expect(positions[2].id).toBe("small");
    });
  });

  describe("ordered strategy", () => {
    it("places first row items in strict input order", () => {
      const items = [
        { id: "a", width: 100, height: 50 },
        { id: "b", width: 100, height: 100 },
        { id: "c", width: 100, height: 75 },
      ];
      const result = pack(items, 500, 0, "ordered");

      // All fit on first row, should maintain exact input order
      const row1 = result.placements.filter((p) => p.y === 0);
      row1.sort((a, b) => a.x - b.x);

      expect(row1[0].id).toBe("a");
      expect(row1[1].id).toBe("b");
      expect(row1[2].id).toBe("c");
    });

    it("places row 1 items strictly at y=0", () => {
      const items = [
        { id: "a", width: 200, height: 100 },
        { id: "b", width: 200, height: 100 },
      ];
      const result = pack(items, 500, 0, "ordered");

      // Both should be at y=0
      expect(result.placements.every((p) => p.y === 0)).toBe(true);
    });
  });

  describe("no overlapping placements", () => {
    it("ensures no items overlap", () => {
      const items = [
        { id: "a", width: 150, height: 100 },
        { id: "b", width: 150, height: 150 },
        { id: "c", width: 200, height: 100 },
        { id: "d", width: 100, height: 200 },
        { id: "e", width: 180, height: 80 },
      ];
      const result = pack(items, 400, 8);

      // Check that no two placements overlap
      for (let i = 0; i < result.placements.length; i++) {
        for (let j = i + 1; j < result.placements.length; j++) {
          const a = result.placements[i];
          const b = result.placements[j];

          const aRight = a.x + a.width;
          const aBottom = a.y + a.height;
          const bRight = b.x + b.width;
          const bBottom = b.y + b.height;

          const overlaps =
            a.x < bRight && aRight > b.x && a.y < bBottom && aBottom > b.y;

          expect(overlaps).toBe(false);
        }
      }
    });
  });

  describe("totalHeight calculation", () => {
    it("calculates correct total height", () => {
      const items = [
        { id: "a", width: 400, height: 100 },
        { id: "b", width: 400, height: 150 },
      ];
      const result = pack(items, 500, 10);

      // Items stack vertically: 100 + 10 (gap) + 150 = 260
      // But totalHeight is the bottom of the last item: 100 + 10 + 150 = 260
      expect(result.totalHeight).toBe(260);
    });

    it("returns 0 height for empty items", () => {
      const result = pack([], 500);
      expect(result.totalHeight).toBe(0);
    });
  });
});
