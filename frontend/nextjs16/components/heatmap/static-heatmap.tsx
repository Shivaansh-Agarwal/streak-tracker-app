import heatmapCellColor from "@/components/heatmap/heatmap-util";

const PATTERN = [
  0, 0, 3, 6, 0, 9, 2, 0, 5, 8, 0, 1, 1, 4, 0, 7, 10, 0, 3, 6, 9, 0, 2, 5, 0, 8,
  2, 5, 0, 11, 4, 7, 0, 3, 6, 0, 6, 0, 4, 9, 1, 0, 8, 2, 5, 10, 0, 3, 0, 2, 7,
  0, 5, 8, 3, 0, 6, 9, 1, 0, 3, 6, 0, 1, 4, 7, 0, 10, 2, 5, 0, 8, 0, 5, 8, 2, 0,
  6, 9, 3, 7, 0, 4, 1,
];

function StaticHeatmap() {
  return (
    <div className="grid grid-cols-12 gap-1.5">
      {PATTERN.map((hours, index) => (
        <div
          key={index}
          className="h-4 w-4 rounded-sm"
          style={{ backgroundColor: heatmapCellColor(hours) }}
        />
      ))}
    </div>
  );
}

export default StaticHeatmap;
