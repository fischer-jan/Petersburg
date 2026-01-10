# Petersburg

A React layout library implementing Hermitage-style 2D bin-packing for picture arrangement.

Named after the Hermitage Museum in St. Petersburg, where curators arrange paintings tetris-style to maximize limited wall space.

## Features

- **MaxRects bin-packing algorithm** — efficient 2D rectangle packing
- **Multiple sort strategies** — optimize for packing efficiency or preserve input order
- **Responsive** — auto-measures container and recalculates on resize
- **Accessible** — DOM order matches visual flow for proper tab navigation
- **Lightweight** — no dependencies beyond React

## Installation

```bash
npm install petersburg
```

## Basic Usage

```tsx
import { HermitageLayout } from 'petersburg';

const items = [
  { id: '1', width: 200, height: 150, content: <img src="..." /> },
  { id: '2', width: 100, height: 100, content: <img src="..." /> },
  { id: '3', width: 150, height: 200, content: <img src="..." /> },
];

function Gallery() {
  return (
    <HermitageLayout
      items={items}
      gap={8}
      sortStrategy="ordered"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `LayoutItem[]` | required | Array of items to layout |
| `containerWidth` | `number` | auto | Fixed width in pixels. If omitted, measures parent container. |
| `gap` | `number` | `8` | Gap between items in pixels |
| `sortStrategy` | `SortStrategy` | `"none"` | How to order items during packing |
| `className` | `string` | — | CSS class for the container |

## Types

```tsx
interface LayoutItem {
  id: string;
  width: number;
  height: number;
  content: ReactNode;
}

type SortStrategy =
  | "none"        // Keep input order
  | "height-desc" // Sort by height descending (best packing)
  | "ordered";    // Row 1 strict order, row 2+ flexible
```

## Sort Strategies

### `none`
Items are placed in input order using the MaxRects algorithm. Good for when your input is already sorted (e.g., by date) and you want to preserve that order as much as possible.

### `height-desc`
Items are sorted by height (tallest first) before packing. This typically produces the most compact layout with minimal wasted space.

### `ordered`
A hybrid approach for galleries where order matters at the top but efficiency matters overall:
- **Row 1**: Items placed strictly left-to-right in input order
- **Row 2**: Next batch of items, can be reordered within the row to fill gaps
- **Row 3+**: Full algorithmic freedom for optimal packing

This is ideal for "newest items at top" layouts where the first row should show items 1, 2, 3... in order, but lower rows can be optimized.

## Responsive Layouts

Omit `containerWidth` to enable responsive mode:

```tsx
<div style={{ width: '100%' }}>
  <HermitageLayout items={items} gap={8} />
</div>
```

The component will measure its parent container and recalculate the layout when the container resizes.

## Fixed Width

For fixed-width layouts, provide `containerWidth`:

```tsx
<HermitageLayout
  items={items}
  containerWidth={800}
  gap={8}
/>
```

## Styling Items

Each item is rendered in an absolutely-positioned wrapper. Style your content to fill it:

```tsx
const items = [
  {
    id: '1',
    width: 200,
    height: 150,
    content: (
      <img
        src="..."
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ),
  },
];
```

## Animations

Petersburg intentionally doesn't include animations to stay lightweight. Add your own with CSS transitions:

```css
.my-gallery img {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
```

Or use your preferred animation library on the item content.

## How It Works

Petersburg uses the **MaxRects** bin-packing algorithm:

1. Start with the full container as free space
2. For each item, find the best position (topmost, then leftmost)
3. Place the item and split the remaining free space into new rectangles
4. Prune redundant free rectangles
5. Repeat until all items are placed

This produces efficient layouts where items fill gaps left by differently-sized neighbors.

## License

MIT
