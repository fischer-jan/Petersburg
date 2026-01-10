import { useMemo, useRef, useState, useEffect } from "react";
import { HermitageLayoutProps } from "./types";
import { pack } from "./maxrects";

export function HermitageLayout({
  items,
  containerWidth: fixedWidth,
  gap = 8,
  sortStrategy = "none",
  className,
}: HermitageLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);

  // Use fixed width if provided, otherwise use measured width
  const containerWidth = fixedWidth ?? measuredWidth;

  // Measure container width using ResizeObserver
  useEffect(() => {
    if (fixedWidth !== undefined) {
      // Fixed width provided, no need to measure
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setMeasuredWidth(width);
      }
    });

    observer.observe(element);

    // Initial measurement
    setMeasuredWidth(element.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, [fixedWidth]);

  const { placements, totalHeight } = useMemo(() => {
    if (containerWidth === 0) {
      // Not yet measured, return empty layout
      return { placements: [], totalHeight: 0 };
    }
    return pack(items, containerWidth, gap, sortStrategy);
  }, [items, containerWidth, gap, sortStrategy]);

  // Create a map for quick lookup of placements by id
  const placementMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const p of placements) {
      map.set(p.id, { x: p.x, y: p.y });
    }
    return map;
  }, [placements]);

  // Sort items by visual position (y, then x) for proper tab order
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const posA = placementMap.get(a.id);
      const posB = placementMap.get(b.id);
      if (!posA || !posB) return 0;
      if (posA.y !== posB.y) return posA.y - posB.y;
      return posA.x - posB.x;
    });
  }, [items, placementMap]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: fixedWidth ?? "100%",
        height: totalHeight || undefined,
      }}
    >
      {sortedItems.map((item) => {
        const position = placementMap.get(item.id);
        if (!position) return null;

        return (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: position.x,
              top: position.y,
              width: item.width,
              height: item.height,
            }}
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
}
