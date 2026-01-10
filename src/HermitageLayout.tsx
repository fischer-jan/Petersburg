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
  const measureRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(
    new Map()
  );
  
  // Use fixed width if provided, otherwise use measured width
  const containerWidth = fixedWidth ?? measuredWidth;

  // Check which items need height measurement
  const itemsNeedingMeasure = useMemo(() => {
    return items.filter((item) => item.height === undefined);
  }, [items]);

  const needsMeasurement = itemsNeedingMeasure.length > 0;

  // Measure container width using ResizeObserver
  useEffect(() => {
    if (fixedWidth !== undefined) {
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
    setMeasuredWidth(element.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, [fixedWidth]);

  // Measure item heights when needed
  useEffect(() => {
    if (!needsMeasurement || containerWidth === 0) {
      return;
    }

    // Wait for next frame to ensure measurement elements are rendered
    requestAnimationFrame(() => {
      const measureContainer = measureRef.current;
      if (!measureContainer) {
        return;
      }

      const newHeights = new Map<string, number>();

      for (const item of itemsNeedingMeasure) {
        const element = measureContainer.querySelector(
          `[data-measure-id="${item.id}"]`
        );
        if (element) {
          newHeights.set(item.id, element.getBoundingClientRect().height);
        }
      }

      setMeasuredHeights(newHeights);
    });
  }, [itemsNeedingMeasure, needsMeasurement, containerWidth]);

  // Build items with resolved heights
  const resolvedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      height: item.height ?? measuredHeights.get(item.id) ?? 0,
    }));
  }, [items, measuredHeights]);

  // Check if we have all heights resolved
  const allHeightsResolved = resolvedItems.every((item) => item.height > 0);

  const { placements, totalHeight } = useMemo(() => {
    if (containerWidth === 0 || !allHeightsResolved) {
      return { placements: [], totalHeight: 0 };
    }
    return pack(resolvedItems, containerWidth, gap, sortStrategy);
  }, [resolvedItems, containerWidth, gap, sortStrategy, allHeightsResolved]);

  // Create a map for quick lookup of placements by id
  const placementMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; height: number }>();
    for (const p of placements) {
      map.set(p.id, { x: p.x, y: p.y, height: p.height });
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

  // Show layout only when all measurements are complete
  const showLayout = allHeightsResolved && containerWidth > 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: fixedWidth ?? "100%",
        height: totalHeight || undefined,
        overflow: "hidden",
      }}
    >
      {/* Hidden measurement container for items without explicit height */}
      {needsMeasurement && containerWidth > 0 && !allHeightsResolved && (
        <div
          ref={measureRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
          }}
        >
          {itemsNeedingMeasure.map((item) => (
            <div
              key={item.id}
              data-measure-id={item.id}
              style={{ width: item.width }}
            >
              {item.content}
            </div>
          ))}
        </div>
      )}

      {/* Main layout */}
      {showLayout &&
        sortedItems.map((item) => {
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
                height: position.height,
              }}
            >
              {item.content}
            </div>
          );
        })}
    </div>
  );
}
