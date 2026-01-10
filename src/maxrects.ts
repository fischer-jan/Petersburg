import { Rect, PlacedItem, PackResult, SortStrategy } from "./types";

interface PackInput {
  id: string;
  width: number;
  height: number;
}

/**
 * Calculate a safe maximum height for the packing area.
 * Uses sum of all item heights as worst-case (vertical stack).
 */
function calcMaxHeight(items: PackInput[], gap: number): number {
  const totalHeight = items.reduce((sum, item) => sum + item.height + gap, 0);
  return Math.max(totalHeight, 1000); // At least 1000px
}

function sortItems(items: PackInput[], strategy: SortStrategy): PackInput[] {
  if (strategy === "none" || strategy === "ordered") {
    // "ordered" uses a different placement approach, not pre-sorting
    return items;
  }

  const sorted = [...items];

  switch (strategy) {
    case "height-desc":
      sorted.sort((a, b) => b.height - a.height);
      break;
  }

  return sorted;
}

/**
 * MaxRects bin-packing algorithm.
 * Places rectangles in a container, minimizing wasted space.
 */
export function pack(
  items: PackInput[],
  containerWidth: number,
  gap: number = 0,
  sortStrategy: SortStrategy = "none"
): PackResult {
  if (sortStrategy === "ordered") {
    return packOrdered(items, containerWidth, gap);
  }

  const sortedItems = sortItems(items, sortStrategy);

  // Start with one large free rectangle
  const maxHeight = calcMaxHeight(sortedItems, gap);
  const freeRects: Rect[] = [
    { x: 0, y: 0, width: containerWidth, height: maxHeight },
  ];

  const placements: PlacedItem[] = [];
  let maxY = 0;

  for (const item of sortedItems) {
    // Account for gap in item dimensions during placement
    const paddedWidth = item.width + gap;
    const paddedHeight = item.height + gap;

    const position = findBestPosition(paddedWidth, paddedHeight, freeRects);

    if (position) {
      const placement: PlacedItem = {
        id: item.id,
        x: position.x,
        y: position.y,
        width: item.width,
        height: item.height,
      };
      placements.push(placement);

      // Track the maximum Y extent
      maxY = Math.max(maxY, position.y + item.height);

      // Split free rects around the placed item (using padded dimensions)
      const placedRect: Rect = {
        x: position.x,
        y: position.y,
        width: paddedWidth,
        height: paddedHeight,
      };
      splitFreeRects(freeRects, placedRect);
      pruneFreeRects(freeRects);
    }
  }

  return {
    placements,
    totalHeight: maxY,
  };
}

/**
 * Ordered packing strategy:
 * - Row 1 (y=0): Strict input order, left-to-right, no gap filling
 * - Row 2: Next batch of items (in input order), can be reordered for better fit
 * - Row 3+: Full algorithmic freedom (height-desc sorting)
 */
function packOrdered(
  items: PackInput[],
  containerWidth: number,
  gap: number
): PackResult {
  // Start with full container as free space
  const maxHeight = calcMaxHeight(items, gap);
  const freeRects: Rect[] = [
    { x: 0, y: 0, width: containerWidth, height: maxHeight },
  ];

  const placements: PlacedItem[] = [];
  let maxY = 0;
  let itemIndex = 0;

  // --- Row 1: Strict left-to-right order at y=0 ---
  let row1NextX = 0;
  const row1Count = countRow1Items(items, containerWidth, gap);

  for (let i = 0; i < row1Count; i++) {
    const item = items[itemIndex];
    const paddedWidth = item.width + gap;
    const paddedHeight = item.height + gap;

    const placement: PlacedItem = {
      id: item.id,
      x: row1NextX,
      y: 0,
      width: item.width,
      height: item.height,
    };
    placements.push(placement);

    maxY = Math.max(maxY, item.height);

    // Update freeRects to account for this placement
    const placedRect: Rect = {
      x: row1NextX,
      y: 0,
      width: paddedWidth,
      height: paddedHeight,
    };
    splitFreeRects(freeRects, placedRect);
    pruneFreeRects(freeRects);

    row1NextX += paddedWidth;
    itemIndex++;
  }

  // Remaining items after row 1
  const remainingItems = items.slice(itemIndex);

  if (remainingItems.length === 0) {
    return { placements, totalHeight: maxY };
  }

  // --- Row 2: Next batch of items, reorderable for better fit ---
  // Take roughly the same count as row 1 (or remaining, whichever is smaller)
  const row2CandidateCount = Math.min(row1Count, remainingItems.length);
  const row2Candidates = remainingItems.slice(0, row2CandidateCount);
  const row3Items = remainingItems.slice(row2CandidateCount);

  // Sort row 2 candidates by height-desc for better gap filling
  const row2Sorted = [...row2Candidates].sort((a, b) => b.height - a.height);

  for (const item of row2Sorted) {
    const paddedWidth = item.width + gap;
    const paddedHeight = item.height + gap;

    const position = findBestPosition(paddedWidth, paddedHeight, freeRects);

    if (position) {
      const placement: PlacedItem = {
        id: item.id,
        x: position.x,
        y: position.y,
        width: item.width,
        height: item.height,
      };
      placements.push(placement);

      maxY = Math.max(maxY, position.y + item.height);

      const placedRect: Rect = {
        x: position.x,
        y: position.y,
        width: paddedWidth,
        height: paddedHeight,
      };
      splitFreeRects(freeRects, placedRect);
      pruneFreeRects(freeRects);
    }
  }

  // --- Row 3+: Full freedom, height-desc sorting ---
  const row3Sorted = [...row3Items].sort((a, b) => b.height - a.height);

  for (const item of row3Sorted) {
    const paddedWidth = item.width + gap;
    const paddedHeight = item.height + gap;

    const position = findBestPosition(paddedWidth, paddedHeight, freeRects);

    if (position) {
      const placement: PlacedItem = {
        id: item.id,
        x: position.x,
        y: position.y,
        width: item.width,
        height: item.height,
      };
      placements.push(placement);

      maxY = Math.max(maxY, position.y + item.height);

      const placedRect: Rect = {
        x: position.x,
        y: position.y,
        width: paddedWidth,
        height: paddedHeight,
      };
      splitFreeRects(freeRects, placedRect);
      pruneFreeRects(freeRects);
    }
  }

  return {
    placements,
    totalHeight: maxY,
  };
}

/**
 * Count how many items fit in row 1 (strict left-to-right at y=0).
 */
function countRow1Items(
  items: PackInput[],
  containerWidth: number,
  gap: number
): number {
  let x = 0;
  let count = 0;

  for (const item of items) {
    const paddedWidth = item.width + gap;
    if (x + paddedWidth > containerWidth + gap) {
      break;
    }
    x += paddedWidth;
    count++;
  }

  return count;
}

/**
 * Find a position for an item, but only accept positions at a specific y.
 */
function _findPositionAtY(
  width: number,
  height: number,
  freeRects: Rect[],
  targetY: number
): { x: number; y: number } | null {
  let bestX = Infinity;
  let bestPosition: { x: number; y: number } | null = null;

  for (const rect of freeRects) {
    // Only consider rects that start at targetY
    if (rect.y !== targetY) continue;

    if (width <= rect.width && height <= rect.height) {
      const x = rect.x;
      if (x < bestX) {
        bestX = x;
        bestPosition = { x, y: targetY };
      }
    }
  }

  return bestPosition;
}

/**
 * Get the maximum height among a list of items.
 */
function _getMaxHeight(items: PackInput[]): number {
  return items.reduce((max, item) => Math.max(max, item.height), 0);
}

/**
 * Find the best position for an item using "Best Y then Best X" heuristic.
 * Prefers positions higher up (smaller Y), then leftward (smaller X).
 */
function findBestPosition(
  width: number,
  height: number,
  freeRects: Rect[]
): { x: number; y: number } | null {
  let bestY = Infinity;
  let bestX = Infinity;
  let bestPosition: { x: number; y: number } | null = null;

  for (const rect of freeRects) {
    // Check if item fits in this free rect
    if (width <= rect.width && height <= rect.height) {
      // Position at top-left corner of free rect
      const x = rect.x;
      const y = rect.y;

      // Prefer smaller Y, then smaller X
      if (y < bestY || (y === bestY && x < bestX)) {
        bestY = y;
        bestX = x;
        bestPosition = { x, y };
      }
    }
  }

  return bestPosition;
}

/**
 * Split free rectangles that overlap with the placed rectangle.
 * Generates up to 4 new rectangles around the placed item.
 */
function splitFreeRects(freeRects: Rect[], placedRect: Rect): void {
  const newRects: Rect[] = [];

  for (let i = freeRects.length - 1; i >= 0; i--) {
    const freeRect = freeRects[i];

    // Check if this free rect overlaps with placed rect
    if (!rectsOverlap(freeRect, placedRect)) {
      continue;
    }

    // Remove the overlapping free rect
    freeRects.splice(i, 1);

    // Generate new free rects from the non-overlapping portions

    // Left portion
    if (placedRect.x > freeRect.x) {
      newRects.push({
        x: freeRect.x,
        y: freeRect.y,
        width: placedRect.x - freeRect.x,
        height: freeRect.height,
      });
    }

    // Right portion
    const placedRight = placedRect.x + placedRect.width;
    const freeRight = freeRect.x + freeRect.width;
    if (placedRight < freeRight) {
      newRects.push({
        x: placedRight,
        y: freeRect.y,
        width: freeRight - placedRight,
        height: freeRect.height,
      });
    }

    // Top portion
    if (placedRect.y > freeRect.y) {
      newRects.push({
        x: freeRect.x,
        y: freeRect.y,
        width: freeRect.width,
        height: placedRect.y - freeRect.y,
      });
    }

    // Bottom portion
    const placedBottom = placedRect.y + placedRect.height;
    const freeBottom = freeRect.y + freeRect.height;
    if (placedBottom < freeBottom) {
      newRects.push({
        x: freeRect.x,
        y: placedBottom,
        width: freeRect.width,
        height: freeBottom - placedBottom,
      });
    }
  }

  // Add all new rects
  freeRects.push(...newRects);
}

/**
 * Remove free rectangles that are fully contained within other free rectangles.
 */
function pruneFreeRects(freeRects: Rect[]): void {
  for (let i = freeRects.length - 1; i >= 0; i--) {
    for (let j = 0; j < freeRects.length; j++) {
      if (i === j) continue;

      if (rectContains(freeRects[j], freeRects[i])) {
        freeRects.splice(i, 1);
        break;
      }
    }
  }
}

/**
 * Check if two rectangles overlap.
 */
function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check if rectangle `outer` fully contains rectangle `inner`.
 */
function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}
