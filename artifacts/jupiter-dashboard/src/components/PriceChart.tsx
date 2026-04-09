import { useState, useEffect, useRef, useCallback } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, type IChartApi, type ISeriesApi, type CandlestickData, type LineData, type HistogramData, type Time } from "lightweight-charts";
import { useGetTokenPrice, useGetOHLCV, getGetTokenPriceQueryKey, getGetOHLCVQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Zap, BarChart2 } from "lucide-react";

type Resolution = "5m" | "15m" | "1h" | "4h" | "1d";

const RESOLUTIONS: { key: Resolution; label: string }[] = [
  { key: "5m",  label: "5M"  },
  { key: "15m", label: "15M" },
  { key: "1h",  label: "1H"  },
  { key: "4h",  label: "4H"  },
  { key: "1d",  label: "1D"  },
];

function formatPrice(n: number): string {
  if (!n || n === 0) return "$0.00";
  if (n < 0.000001) return `$${n.toExponential(4)}`;
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

export function PriceChartCard({ mintAddress }: { mintAddress: string }) {
  const queryClient = useQueryClient();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [resolution, setResolution] = useState<Resolution>("1h");
  const [countdown, setCountdown] = useState(30);
  const [isFlashing, setIsFlashing] = useState(false);
  const [tooltip, setTooltip] = useState<{ time: string; open: number; high: number; low: number; close: number; volume: number; isUp: boolean } | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const latestPriceRef = useRef<number | null>(null);

  const { data: priceData } = useGetTokenPrice(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenPriceQueryKey(mintAddress) },
  });

  const { data: ohlcvData, isLoading: ohlcvLoading } = useGetOHLCV(
    mintAddress,
    { resolution, bars: 1000 },
    { query: { enabled: !!mintAddress, queryKey: getGetOHLCVQueryKey(mintAddress, { resolution, bars: 1000 }) } }
  );

  const currentPrice = priceData?.price ? parseFloat(priceData.price) : null;

  // Track live price changes
  useEffect(() => {
    if (currentPrice != null && currentPrice !== latestPriceRef.current) {
      latestPriceRef.current = currentPrice;
      setLivePrice(currentPrice);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 600);

      // Update the last candle's close with the live price
      if (candleSeriesRef.current && ohlcvData?.candles && ohlcvData.candles.length > 0) {
        const last = ohlcvData.candles[ohlcvData.candles.length - 1]!;
        const updatedCandle: CandlestickData = {
          time: last.time as Time,
          open: last.open,
          high: Math.max(last.high, currentPrice),
          low: Math.min(last.low, currentPrice),
          close: currentPrice,
        };
        try { candleSeriesRef.current.update(updatedCandle); } catch {}
      }
    }
  }, [currentPrice, ohlcvData]);

  // 30-second price refresh with countdown
  useEffect(() => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          queryClient.invalidateQueries({ queryKey: getGetTokenPriceQueryKey(mintAddress) });
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mintAddress, queryClient]);

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#8888aa",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(255,255,255,0.3)", labelBackgroundColor: "#1a1a2e" },
        horzLine: { color: "rgba(255,255,255,0.3)", labelBackgroundColor: "#1a1a2e" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.05)",
        textColor: "#8888aa",
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.05)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    // Volume histogram (lower pane via scale)
    const volSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(153,69,255,0.3)",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#14F195",
      downColor: "#FF4444",
      borderUpColor: "#14F195",
      borderDownColor: "#FF4444",
      wickUpColor: "#14F19588",
      wickDownColor: "#FF444488",
      priceLineVisible: true,
      priceLineColor: "rgba(255,255,255,0.3)",
      lastValueVisible: true,
    });

    // Live price line overlay
    const liveLine = chart.addSeries(LineSeries, {
      color: "#9945FF",
      lineWidth: 1,
      lineStyle: 2,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volSeries;
    lineSeriesRef.current = liveLine;

    // Crosshair tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setTooltip(null);
        return;
      }
      const candle = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      const vol = param.seriesData.get(volSeries) as HistogramData | undefined;
      if (candle) {
        const ts = typeof param.time === "number" ? param.time * 1000 : 0;
        const dt = new Date(ts);
        setTooltip({
          time: dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }),
          open: candle.open as number,
          high: candle.high as number,
          low: candle.low as number,
          close: candle.close as number,
          volume: (vol?.value as number) ?? 0,
          isUp: (candle.close as number) >= (candle.open as number),
        });
      }
    });

    // Resize observer
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0]!.contentRect;
      chart.applyOptions({ width, height });
    });
    observer.observe(chartContainerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      lineSeriesRef.current = null;
    };
  }, []);

  // Load OHLCV data into chart
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !ohlcvData?.candles) return;
    if (ohlcvData.candles.length === 0) return;

    const candles: CandlestickData[] = ohlcvData.candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumes: HistogramData[] = ohlcvData.candles.map(c => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? "rgba(20,241,149,0.25)" : "rgba(255,68,68,0.25)",
    }));

    try {
      candleSeriesRef.current.setData(candles);
      volumeSeriesRef.current.setData(volumes);

      // Scroll to the most recent data
      chartRef.current?.timeScale().scrollToRealTime();
    } catch {}
  }, [ohlcvData]);

  // Compute price stats from current OHLCV candles
  const candles = ohlcvData?.candles ?? [];
  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const displayPrice = livePrice ?? lastCandle?.close ?? null;
  const openPrice = lastCandle?.open ?? null;
  const candleDelta = displayPrice != null && openPrice != null ? displayPrice - openPrice : 0;
  const candleDeltaPct = openPrice != null && openPrice > 0 ? (candleDelta / openPrice) * 100 : 0;
  const isUp = candleDelta >= 0;

  return (
    <div className="glass-card overflow-hidden flex flex-col" data-testid="price-chart-card">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <BarChart2 className="w-4 h-4 text-secondary" />
          <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Price Chart</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isFlashing ? "#FFFFFF" : "#14F195",
                boxShadow: isFlashing ? "0 0 10px #FFFFFF" : "0 0 6px #14F195",
                transition: "background 0.3s, box-shadow 0.3s",
              }}
            />
            <span className="text-xs font-bold" style={{ color: "#14F195" }}>LIVE</span>
          </div>
        </div>

        {/* Resolution tabs */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {RESOLUTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setResolution(key)}
              className="px-3 py-1.5 text-xs font-bold transition-colors"
              style={{
                background: resolution === key ? "rgba(153,69,255,0.3)" : "transparent",
                color: resolution === key ? "#9945FF" : "#8888aa",
                borderRight: key !== "1d" ? "1px solid rgba(255,255,255,0.06)" : undefined,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price display + tooltip */}
      <div className="px-5 py-3 flex items-start gap-6 shrink-0">
        <div>
          <div
            className="text-3xl font-bold tracking-tight"
            style={{
              color: isFlashing ? (isUp ? "#14F195" : "#FF4444") : "#FFFFFF",
              transition: "color 0.4s",
            }}
          >
            {displayPrice != null ? formatPrice(displayPrice) : "—"}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {candleDelta !== 0 ? (
              <span className="text-sm font-semibold" style={{ color: isUp ? "#14F195" : "#FF4444" }}>
                {isUp ? "▲" : "▼"} {Math.abs(candleDeltaPct).toFixed(2)}%
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">— 0.00%</span>
            )}
            <span className="text-xs text-muted-foreground">candle open</span>
          </div>
        </div>

        {/* Crosshair tooltip overlay */}
        {tooltip && (
          <div className="flex items-center gap-4 text-xs font-mono ml-2 flex-wrap">
            <span className="text-muted-foreground">{tooltip.time}</span>
            <span>O: <span style={{ color: tooltip.isUp ? "#14F195" : "#FF4444" }}>{formatPrice(tooltip.open)}</span></span>
            <span>H: <span style={{ color: "#14F195" }}>{formatPrice(tooltip.high)}</span></span>
            <span>L: <span style={{ color: "#FF4444" }}>{formatPrice(tooltip.low)}</span></span>
            <span>C: <span style={{ color: tooltip.isUp ? "#14F195" : "#FF4444" }}>{formatPrice(tooltip.close)}</span></span>
            <span>Vol: <span className="text-white">{formatVolume(tooltip.volume)}</span></span>
          </div>
        )}

        <div className="ml-auto text-right shrink-0">
          {firstCandle && (
            <div className="text-xs text-muted-foreground">
              From {new Date(firstCandle.time * 1000).toLocaleDateString()}
            </div>
          )}
          <div className="text-xs text-muted-foreground">{candles.length} candles</div>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative flex-1 min-h-[280px]">
        {ohlcvLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "rgba(10,10,15,0.7)" }}>
            <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Loading historical data…
            </div>
          </div>
        )}
        {!ohlcvLoading && candles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No chart data available for this resolution
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" style={{ minHeight: 280 }} />
      </div>

      {/* Countdown bar */}
      <div className="px-5 py-2.5 border-t flex items-center gap-3 shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <RefreshCw className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${((30 - countdown) / 30) * 100}%`,
              background: "linear-gradient(90deg, #9945FF, #14F195)",
              transition: "width 1s linear",
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">Live refresh in {countdown}s</span>
        {ohlcvData?.pairAddress && (
          <a
            href={`https://dexscreener.com/solana/${ohlcvData.pairAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            View on DexScreener ↗
          </a>
        )}
      </div>
    </div>
  );
}
