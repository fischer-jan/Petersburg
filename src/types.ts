import { ReactNode } from "react";

export interface LayoutItem {
  id: string;
  width: number;
  /** If omitted, height is auto-measured from rendered content */
  height?: number;
  content: ReactNode;
}

export type SortStrategy =
  | "none"        // Keep input order, pure MaxRects placement
  | "height-desc" // Sort by height descending, often best packing
  | "ordered";    // Row 1 strict order, Row 2 flexible, Row 3+ free

export interface HermitageLayoutProps {
  items: LayoutItem[];
  /** Fixed width. If omitted, component auto-measures its container. */
  containerWidth?: number;
  gap?: number;
  sortStrategy?: SortStrategy;
  className?: string;
}

// Internal types for the packing algorithm

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacedItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PackResult {
  placements: PlacedItem[];
  totalHeight: number;
}
