export function heatmapCellColor(hours: number) {
  if (hours <= 0) return "#e7e5e4";
  const intensity = Math.min(hours, 12) / 12;
  const start = { r: 187, g: 226, b: 194 };
  const end = { r: 22, g: 101, b: 52 };
  const r = Math.round(start.r + (end.r - start.r) * intensity);
  const g = Math.round(start.g + (end.g - start.g) * intensity);
  const b = Math.round(start.b + (end.b - start.b) * intensity);
  return `rgb(${r}, ${g}, ${b})`;
}
