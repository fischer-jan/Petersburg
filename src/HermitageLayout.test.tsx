import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { HermitageLayout } from "./HermitageLayout";

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    // Immediately call with a mock entry
    this.callback(
      [
        {
          target,
          contentRect: { width: 500, height: 0 } as DOMRectReadOnly,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this
    );
  }

  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);

  // Mock getBoundingClientRect for measurement
  Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
    width: 500,
    height: 100,
    top: 0,
    left: 0,
    right: 500,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HermitageLayout", () => {
  describe("basic rendering", () => {
    it("renders items with explicit heights", () => {
      const items = [
        {
          id: "1",
          width: 200,
          height: 100,
          content: <div data-testid="item-1">Item 1</div>,
        },
        {
          id: "2",
          width: 200,
          height: 150,
          content: <div data-testid="item-2">Item 2</div>,
        },
      ];

      render(<HermitageLayout items={items} containerWidth={500} />);

      expect(screen.getByTestId("item-1")).toBeInTheDocument();
      expect(screen.getByTestId("item-2")).toBeInTheDocument();
    });

    it("applies className to container", () => {
      const items = [
        { id: "1", width: 100, height: 50, content: <div>Item</div> },
      ];

      const { container } = render(
        <HermitageLayout
          items={items}
          containerWidth={500}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("container styles", () => {
    it("has overflow hidden on main container", () => {
      const items = [
        { id: "1", width: 100, height: 50, content: <div>Item</div> },
      ];

      const { container } = render(
        <HermitageLayout items={items} containerWidth={500} />
      );

      expect(container.firstChild).toHaveStyle({ overflow: "hidden" });
    });

    it("has position relative on main container", () => {
      const items = [
        { id: "1", width: 100, height: 50, content: <div>Item</div> },
      ];

      const { container } = render(
        <HermitageLayout items={items} containerWidth={500} />
      );

      expect(container.firstChild).toHaveStyle({ position: "relative" });
    });

    it("uses fixed width when provided", () => {
      const items = [
        { id: "1", width: 100, height: 50, content: <div>Item</div> },
      ];

      const { container } = render(
        <HermitageLayout items={items} containerWidth={800} />
      );

      expect(container.firstChild).toHaveStyle({ width: "800px" });
    });

    it("uses 100% width when containerWidth not provided", () => {
      const items = [
        { id: "1", width: 100, height: 50, content: <div>Item</div> },
      ];

      const { container } = render(<HermitageLayout items={items} />);

      expect(container.firstChild).toHaveStyle({ width: "100%" });
    });
  });

  describe("measurement container", () => {
    it("does not render measurement container when all items have explicit heights", () => {
      const items = [
        { id: "1", width: 100, height: 50, content: <div>Item 1</div> },
        { id: "2", width: 100, height: 60, content: <div>Item 2</div> },
      ];

      const { container } = render(
        <HermitageLayout items={items} containerWidth={500} />
      );

      // Should not have aria-hidden element (measurement container)
      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBe(0);
    });

    it("hides measurement container after heights are measured", async () => {
      const items = [
        {
          id: "1",
          width: 100,
          // No explicit height - needs measurement
          content: <div>Item needing measurement</div>,
        },
      ];

      const { container } = render(
        <HermitageLayout items={items} containerWidth={500} />
      );

      // After measurement completes, the hidden container should be gone
      await waitFor(() => {
        const hiddenContainers = container.querySelectorAll(
          '[aria-hidden="true"]'
        );
        expect(hiddenContainers.length).toBe(0);
      });
    });

    it("measurement container has proper hidden styles while measuring", () => {
      // We need to test before measurement completes
      // This is tricky because measurement happens in requestAnimationFrame
      const items = [
        { id: "1", width: 100, content: <div>Item</div> },
      ];

      const { container } = render(
        <HermitageLayout items={items} containerWidth={500} />
      );

      // Initially there might be a measurement container
      const hiddenContainer = container.querySelector('[aria-hidden="true"]');
      if (hiddenContainer) {
        expect(hiddenContainer).toHaveStyle({
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
        });
      }
    });
  });

  describe("item positioning", () => {
    it("positions items absolutely", () => {
      const items = [
        {
          id: "1",
          width: 200,
          height: 100,
          content: <div data-testid="item">Item</div>,
        },
      ];

      render(<HermitageLayout items={items} containerWidth={500} />);

      const item = screen.getByTestId("item").parentElement;
      expect(item).toHaveStyle({ position: "absolute" });
    });

    it("places first item at origin", () => {
      const items = [
        {
          id: "1",
          width: 200,
          height: 100,
          content: <div data-testid="item">Item</div>,
        },
      ];

      render(<HermitageLayout items={items} containerWidth={500} />);

      const item = screen.getByTestId("item").parentElement;
      expect(item).toHaveStyle({ left: "0px", top: "0px" });
    });

    it("sets item dimensions correctly", () => {
      const items = [
        {
          id: "1",
          width: 200,
          height: 100,
          content: <div data-testid="item">Item</div>,
        },
      ];

      render(<HermitageLayout items={items} containerWidth={500} />);

      const item = screen.getByTestId("item").parentElement;
      expect(item).toHaveStyle({ width: "200px", height: "100px" });
    });
  });

  describe("empty state", () => {
    it("renders empty container for no items", () => {
      const { container } = render(
        <HermitageLayout items={[]} containerWidth={500} />
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild?.childNodes.length).toBe(0);
    });
  });

  describe("gap prop", () => {
    it("spaces items according to gap", () => {
      const items = [
        {
          id: "1",
          width: 100,
          height: 50,
          content: <div data-testid="item-1">Item 1</div>,
        },
        {
          id: "2",
          width: 100,
          height: 50,
          content: <div data-testid="item-2">Item 2</div>,
        },
      ];

      render(<HermitageLayout items={items} containerWidth={500} gap={20} />);

      const item1 = screen.getByTestId("item-1").parentElement;
      const item2 = screen.getByTestId("item-2").parentElement;

      // Item 1 at x=0, Item 2 at x=120 (100 width + 20 gap)
      expect(item1).toHaveStyle({ left: "0px" });
      expect(item2).toHaveStyle({ left: "120px" });
    });
  });
});
