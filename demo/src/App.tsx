import { HermitageLayout, LayoutItem, SortStrategy } from "petersburg";

const colors = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#34495e",
];

// Generate sample items with varying sizes
const sampleItems: LayoutItem[] = [
  { id: "1", width: 200, height: 150 },
  { id: "2", width: 100, height: 100 },
  { id: "3", width: 150, height: 200 },
  { id: "4", width: 120, height: 80 },
  { id: "5", width: 180, height: 120 },
  { id: "6", width: 100, height: 150 },
  { id: "7", width: 140, height: 100 },
  { id: "8", width: 160, height: 180 },
  { id: "9", width: 90, height: 90 },
  { id: "10", width: 130, height: 110 },
  { id: "11", width: 170, height: 130 },
  { id: "12", width: 110, height: 160 },
].map((item, index) => ({
  ...item,
  content: (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: colors[index % colors.length],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "sans-serif",
        fontSize: "14px",
        fontWeight: "bold",
        borderRadius: "4px",
      }}
    >
      {item.id} ({item.width}x{item.height})
    </div>
  ),
}));

const strategies: SortStrategy[] = ["none", "height-desc", "ordered"];

function LayoutDemo({
  strategy,
  containerWidth,
}: {
  strategy: SortStrategy;
  containerWidth: number;
}) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <h3 style={{ margin: "0 0 8px 0" }}>
        {strategy === "none" && "none (input order)"}
        {strategy === "height-desc" && "height-desc (best packing)"}
        {strategy === "ordered" && "ordered (row 1 strict, row 2+ flexible)"}
      </h3>
      <div
        style={{
          border: "2px dashed #ccc",
          display: "inline-block",
        }}
      >
        <HermitageLayout
          items={sampleItems}
          containerWidth={containerWidth}
          gap={8}
          sortStrategy={strategy}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Petersburg Layout Demo</h1>
      <p>Comparing sort strategies — lower total height = better packing</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(620px, 1fr))",
          gap: "20px",
        }}
      >
        {strategies.map((strategy) => (
          <LayoutDemo key={strategy} strategy={strategy} containerWidth={600} />
        ))}
      </div>
    </div>
  );
}

export default App;
