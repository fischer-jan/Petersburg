import { useMemo } from "react";
import { HermitageLayoutProps } from "./types";
import { pack } from "./maxrects";

export function HermitageLayout({
  items,
  containerWidth,
  gap = 8,
  sortStrategy = "none",
  className,
}: HermitageLayoutProps) {
  const { placements, totalHeight } = useMemo(() => {
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

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: containerWidth,
        height: totalHeight,
      }}
    >
      {items.map((item) => {
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
