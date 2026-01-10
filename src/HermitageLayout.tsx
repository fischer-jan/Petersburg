import { HermitageLayoutProps } from "./types";

export function HermitageLayout({
  items,
  containerWidth,
  gap = 8,
  className,
}: HermitageLayoutProps) {
  // TODO: Implement 2D bin-packing algorithm
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: containerWidth,
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            width: item.width,
            height: item.height,
            marginBottom: gap,
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
