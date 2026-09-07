import type { PricePoint } from "@/lib/demo/types";

function bounds(points: PricePoint[]) { const values = points.flatMap((point) => [point.high, point.low]); const min = Math.min(...values); const max = Math.max(...values); return { min, span: Math.max(max - min, 0.0001) }; }
function x(index: number, total: number, width: number) { return total <= 1 ? width / 2 : (index / (total - 1)) * width; }
function y(value: number, min: number, span: number, height: number) { return height - ((value - min) / span) * height; }

export function LiveLineChart({ points, area = false }: { points: PricePoint[]; area?: boolean }) {
  const width = 720; const height = 220; const { min, span } = bounds(points); const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index, points.length, width)} ${y(point.price, min, span, height)}`).join(" "); const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;
  return <svg data-aos="fade-up" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Live market line graph" className="h-full w-full overflow-visible"><defs><linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b2de4f" stopOpacity=".3" /><stop offset="1" stopColor="#b2de4f" stopOpacity="0" /></linearGradient></defs>{area && <path d={areaPath} fill="url(#line-fill)" /> }<path d={path} fill="none" stroke="#83b92d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /></svg>;
}

export function LiveCandlestickChart({ points }: { points: PricePoint[] }) {
  const width = 720; const height = 220; const { min, span } = bounds(points); const candleWidth = Math.max(5, width / Math.max(points.length, 1) * .56);
  return <svg data-aos="fade-up" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Live candlestick graph" className="h-full w-full overflow-visible">{points.map((point, index) => { const position = x(index, points.length, width); const bullish = point.close >= point.open; const color = bullish ? "#83b92d" : "#d16e6e"; const bodyTop = y(Math.max(point.open, point.close), min, span, height); const bodyHeight = Math.max(2, Math.abs(y(point.open, min, span, height) - y(point.close, min, span, height))); return <g key={`${point.time}-${index}`}><line x1={position} x2={position} y1={y(point.high, min, span, height)} y2={y(point.low, min, span, height)} stroke={color} strokeWidth="1.5" /><rect x={position - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} rx="1" fill={color} /></g>; })}</svg>;
}

export function LiveVolumeChart({ points }: { points: PricePoint[] }) { const max = Math.max(...points.map((point) => point.volume), 1); return <div data-aos="fade-up" className="flex h-full items-end gap-1">{points.map((point, index) => <span key={`${point.time}-${index}`} className="min-w-[3px] flex-1 rounded-t bg-brand-lime/60" style={{ height: `${Math.max(4, (point.volume / max) * 100)}%` }} />)}</div>; }
