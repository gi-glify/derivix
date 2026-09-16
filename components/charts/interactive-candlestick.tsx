import { createPortal } from "react-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useMemo, useRef, useState } from "react";
import { AreaSeries, CandlestickSeries, ColorType, createChart, CrosshairMode, HistogramSeries, LineSeries, LineStyle, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { Download, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import type { PricePoint } from "@/lib/demo/types";
import { useTheme } from "@/lib/ui/theme";
import AnimatedTabs from "@/components/smoothui/animated-tabs";
import { calculateMovingAverage } from "./interactive-candlestick-utils";
import { aggregateCandles, type ChartCandle } from "./chart-data";

export type ChartMode = "candles" | "line" | "area";
const intervals = [{ id: "0", label: "Live" }, { id: "3600", label: "1H" }, { id: "14400", label: "4H" }, { id: "86400", label: "1D" }];
const up = "#089981";
const down = "#f23645";
const price = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: value > 100 ? 2 : 4, maximumFractionDigits: value > 100 ? 2 : 5 });

type ChartState = {
  chart: IChartApi;
  candles: ISeriesApi<"Candlestick">;
  line: ISeriesApi<"Line">;
  area: ISeriesApi<"Area">;
  volume: ISeriesApi<"Histogram">;
  average20: ISeriesApi<"Line">;
  average50: ISeriesApi<"Line">;
};

export function InteractiveCandlestickChart({ points, symbol = "Market", mode = "candles", compact = false, disclosure }: { points: PricePoint[]; symbol?: string; mode?: ChartMode; compact?: boolean; disclosure?: string }) {
  const { theme } = useTheme();
  const [interval, setInterval] = useState(compact ? "3600" : "0");
  const [averages, setAverages] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const api = useRef<ChartState | null>(null);
  const previous = useRef<ChartCandle[]>([]);
  const candles = useMemo(() => aggregateCandles(points, Math.max(1, Number(interval))), [points, interval]);
  const selected = candles.find(point => point.time === hoverTime) ?? candles.at(-1);

  useEffect(() => {
    if (!container.current) return;
    const chart = createChart(container.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 11, attributionLogo: true },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: "#86968f", labelBackgroundColor: "#34443d" }, horzLine: { color: "#86968f", labelBackgroundColor: "#34443d" } },
      rightPriceScale: { borderVisible: false, minimumWidth: compact ? 65 : 72, scaleMargins: { top: 0.08, bottom: 0.14 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: 6, barSpacing: 6, fixLeftEdge: true },
      handleScroll: { vertTouchDrag: false },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, borderVisible: false, wickVisible: true, wickUpColor: up, wickDownColor: down });
    const line = chart.addSeries(LineSeries, { color: up, lineWidth: 1 });
    const area = chart.addSeries(AreaSeries, { lineColor: up, topColor: "rgba(37,168,134,.22)", bottomColor: "rgba(37,168,134,0)", lineWidth: 1 });
    const average20 = chart.addSeries(LineSeries, { color: "#c4a05c", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    const average50 = chart.addSeries(LineSeries, { color: "#7f8de0", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false, priceScaleId: "volume" });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.84, bottom: 0 }, borderVisible: false });
    api.current = { chart, candles: candleSeries, line, area, average20, average50, volume };
    const crosshair = (event: { time?: Time }) => setHoverTime(typeof event.time === "number" ? event.time : null);
    chart.subscribeCrosshairMove(crosshair);
    previous.current = [];
    return () => { chart.unsubscribeCrosshairMove(crosshair); chart.remove(); api.current = null; previous.current = []; };
  }, [compact, expanded]);

  useEffect(() => {
    const state = api.current;
    if (!state) return;
    const dark = theme === "dark";
    state.chart.applyOptions({
      layout: { textColor: dark ? "#929599" : "#788780", background: { type: ColorType.Solid, color: dark ? "#0f0f0f" : "#ffffff" } },
      grid: { vertLines: { color: dark ? "#252525" : "#e7ece9", style: LineStyle.Dotted }, horzLines: { color: dark ? "#252525" : "#e7ece9", style: LineStyle.Dotted } },
    });
  }, [theme, compact, expanded]);

  useEffect(() => {
    const state = api.current;
    if (!state) return;
    state.chart.timeScale().applyOptions({ secondsVisible: interval === "0" });
    const old = previous.current;
    const range = state.chart.timeScale().getVisibleLogicalRange();
    const isFollowing = !range || range.to >= old.length - 1;
    state.candles.setData(candles);
    const closes = candles.map(c => ({ time: c.time, value: c.close }));
    state.line.setData(closes);
    state.area.setData(closes);
    state.volume.setData(candles.map(c => ({ time: c.time, value: c.volume, color: c.close >= c.open ? "rgba(8,153,129,.40)" : "rgba(242,54,69,.40)" })));
    for (const [size, series] of [[20, state.average20], [50, state.average50]] as const) {
      series.setData(calculateMovingAverage(candles.map(c => c.close), size).flatMap((value, i) => value === null ? [] : [{ time: candles[i].time, value }]));
    }
    const precision = (candles.at(-1)?.close ?? 0) > 100 ? 2 : 5;
    for (const series of [state.candles, state.line, state.area]) series.applyOptions({ priceFormat: { type: "price", precision, minMove: 10 ** -precision } });
    if (!old.length && candles.length) {
      state.chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, candles.length - (compact ? 90 : Math.max(60, Math.floor((container.current?.clientWidth ?? 1000) / 7)))), to: candles.length + 5 });
    } else if (range && candles.length) {
      const shift = old[0] ? candles.findIndex(c => c.time === old[0].time) : 0;
      if (isFollowing) {
        const to = candles.length + 5;
        state.chart.timeScale().setVisibleLogicalRange({ from: to - (range.to - range.from), to });
      } else {
        const removed = old.findIndex(c => c.time === candles[0]?.time);
        const offset = shift >= 0 ? shift : -Math.max(0, removed);
        state.chart.timeScale().setVisibleLogicalRange({ from: range.from + offset, to: range.to + offset });
      }
    }
    previous.current = candles;
  }, [candles, compact, expanded, interval]);

  useEffect(() => {
    const state = api.current;
    if (!state) return;
    state.candles.applyOptions({ visible: mode === "candles" });
    state.line.applyOptions({ visible: mode === "line" });
    state.area.applyOptions({ visible: mode === "area" });
    state.average20.applyOptions({ visible: averages });
    state.average50.applyOptions({ visible: averages });
    state.volume.applyOptions({ visible: showVolume });
    state.chart.priceScale("right").applyOptions({ scaleMargins: { top: 0.08, bottom: showVolume ? 0.14 : 0.05 } });
  }, [mode, averages, showVolume, compact, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", escape); };
  }, [expanded]);

  function reset() {
    const chart = api.current?.chart;
    if (!chart) return;
    chart.priceScale("right").applyOptions({ autoScale: true });
    chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, candles.length - (compact ? 90 : Math.max(60, Math.floor((container.current?.clientWidth ?? 1000) / 7)))), to: candles.length + 5 });
  }
  function changeInterval(value: string) { previous.current = []; setHoverTime(null); setInterval(value); }
  function zoom(factor: number) {
    const scale = api.current?.chart.timeScale();
    const range = scale?.getVisibleLogicalRange();
    if (scale && range) scale.setVisibleLogicalRange({ from: range.to - Math.max(10, Math.min(candles.length + 10, (range.to - range.from) * factor)), to: range.to });
  }
  function downloadData() {
    const csv = ["time,open,high,low,close,volume", ...candles.map(c => [new Date(c.time * 1000).toISOString(), c.open, c.high, c.low, c.close, c.volume].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = `derivix-${symbol.replace(/[^a-z0-9]/gi, "-")}-${interval === "0" ? "live-ticks" : `${interval}s`}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const content = <div ref={wrapper} className={`trading-chart ${compact ? "trading-chart--compact" : ""} ${expanded ? "trading-chart--expanded" : ""}`}>
    {disclosure && <div className="border-b border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-600">{disclosure}</div>}
    <div className="chart-toolbar">
      <AnimatedTabs ariaLabel="Candle interval" tabs={intervals} activeTab={interval} onChange={changeInterval} variant="segment" className="chart-intervals" />
      {!compact && <div className="flex items-center gap-1">
        <button type="button" className="chart-tool" aria-pressed={averages} onClick={() => setAverages(!averages)}>MA <span className="text-brand-muted">20 / 50</span></button>
        <button type="button" className="chart-tool" aria-pressed={showVolume} onClick={() => setShowVolume(!showVolume)}>Volume</button>
      </div>}
      <div className="ml-auto flex items-center gap-0.5">
        <button type="button" className="chart-icon" onClick={() => zoom(1.35)} aria-label="Zoom out" title="Zoom out"><Minus size={15} /></button>
        <button type="button" className="chart-icon" onClick={() => zoom(.75)} aria-label="Zoom in" title="Zoom in"><Plus size={15} /></button>
        <button type="button" className="chart-icon" onClick={reset} aria-label="Reset chart view" title="Reset chart view"><RotateCcw size={14} /></button>
        {!compact && <><button type="button" className="chart-icon" onClick={downloadData} aria-label="Download chart data" title="Export CSV"><Download size={14} /></button><ThemeToggle /><button type="button" className="chart-tool" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "Exit fullscreen chart" : "Open fullscreen chart"} title={expanded ? "Exit fullscreen (Esc)" : "Fullscreen chart"}><Maximize2 size={14} /><span>{expanded ? "Exit" : "Fullscreen"}</span></button></>}
      </div>
    </div>
    <div className="chart-legend" aria-label="Candle price details">
      <span className="font-semibold text-brand-ink">{symbol} <span className="ml-1 font-normal text-brand-muted">· {intervals.find(i => i.id === interval)?.label}</span></span>
      {selected && <><span>O <b>{price(selected.open)}</b></span><span>H <b>{price(selected.high)}</b></span><span>L <b>{price(selected.low)}</b></span><span>C <b style={{ color: selected.close >= selected.open ? up : down }}>{price(selected.close)}</b></span>{!compact && <span>Vol <b>{selected.volume.toLocaleString("en-US", { maximumFractionDigits: 0 })}</b></span>}</>}
      {!selected && <span>Waiting for market data…</span>}
    </div>
    {averages && <div className="chart-indicators"><span><i className="bg-[#c4a05c]" /> MA 20</span><span><i className="bg-[#7f8de0]" /> MA 50</span><span className="ml-auto">{selected ? new Date(selected.time * 1000).toISOString().slice(0, interval === "0" ? 19 : 16).replace("T", " ") : ""} UTC</span></div>}
    <div ref={container} className="chart-canvas" aria-label={`${symbol} interactive ${mode} chart with price and volume`} />
    {!compact && <div className="chart-status"><span><i /> {interval === "0" ? "Live simulation · 1.5s ticks" : "Simulated market data"}</span><span>Drag to pan · Scroll to zoom</span><button type="button" onClick={reset}>Go to latest <span aria-hidden="true">→</span></button></div>}
  </div>;
  return expanded ? createPortal(content, document.body) : content;
}
