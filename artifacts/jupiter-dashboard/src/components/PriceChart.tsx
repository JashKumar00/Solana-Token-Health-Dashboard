import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { useGetTokenPrice, getGetTokenPriceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";

interface PricePoint {
  time: string;
  price: number;
  timestamp: number;
}

type TimeWindow = "1s" | "30s" | "1m" | "5m" | "15m" | "all";

const WINDOW_MS: Record<TimeWindow, number> = {
  "1s":  1_000,
  "30s": 30_000,
  "1m":  60_000,
  "5m":  5 * 60_000,
  "15m": 15 * 60_000,
  "all": Infinity,
};

const WINDOW_LABELS: Record<TimeWindow, string> = {
  "1s":  "1S",
  "30s": "30S",
  "1m":  "1M",
  "5m":  "5M",
  "15m": "15M",
  "all": "ALL",
};

function formatPrice(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.000001) return `$${n.toExponential(4)}`;
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(ts: number, window: TimeWindow): string {
  const d = new Date(ts);
  if (window === "1s" || window === "30s") {
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  if (window === "1m" || window === "5m") {
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
      <div className="text-muted-foreground mb-0.5">{label}</div>
      <div className="font-bold text-white">{formatPrice(payload[0].value)}</div>
    </div>
  );
}

export function PriceChartCard({ mintAddress }: { mintAddress: string }) {
  const queryClient = useQueryClient();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("5m");
  const [isFlashing, setIsFlashing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const latestPriceRef = useRef<number | null>(null);
  const [, forceUpdate] = useState(0);

  const { data } = useGetTokenPrice(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenPriceQueryKey(mintAddress) },
  });

  const currentPrice = data?.price ? parseFloat(data.price) : null;

  const addPricePoint = useCallback((price: number) => {
    const now = Date.now();
    const point: PricePoint = {
      time: formatTime(now, "all"),
      price,
      timestamp: now,
    };
    setPriceHistory(prev => {
      const maxPoints = 2000;
      const next = [...prev, point];
      return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
    });
    setLastUpdated(now);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 600);
  }, []);

  useEffect(() => {
    if (currentPrice != null && currentPrice !== latestPriceRef.current) {
      latestPriceRef.current = currentPrice;
      addPricePoint(currentPrice);
    }
  }, [currentPrice, addPricePoint]);

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetTokenPriceQueryKey(mintAddress) });
    }, 5000);
    return () => clearInterval(interval);
  }, [mintAddress, queryClient]);

  // Force re-render every second so the time-window filter stays current
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const windowMs = WINDOW_MS[timeWindow];

  const filtered = timeWindow === "all"
    ? priceHistory
    : priceHistory.filter(p => now - p.timestamp <= windowMs);

  const displayed = filtered.length > 300
    ? filtered.filter((_, i) => i % Math.ceil(filtered.length / 300) === 0)
    : filtered;

  // Re-label x-axis based on current window
  const displayedWithLabel = displayed.map(p => ({
    ...p,
    time: formatTime(p.timestamp, timeWindow),
  }));

  const prices = displayed.map(p => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const priceRange = maxPrice - minPrice;
  const yMin = priceRange === 0 ? minPrice * 0.9995 : minPrice - priceRange * 0.05;
  const yMax = priceRange === 0 ? maxPrice * 1.0005 : maxPrice + priceRange * 0.05;

  const firstPrice = displayed[0]?.price ?? null;
  const lastPrice = displayed[displayed.length - 1]?.price ?? null;
  const priceDelta = firstPrice != null && lastPrice != null ? lastPrice - firstPrice : 0;
  const priceDeltaPct = firstPrice != null && firstPrice > 0 ? (priceDelta / firstPrice) * 100 : 0;
  const isUp = priceDelta >= 0;
  const chartColor = priceDelta === 0 ? "#9945FF" : isUp ? "#14F195" : "#FF4444";

  const tabs: TimeWindow[] = ["1s", "30s", "1m", "5m", "15m", "all"];

  const elapsedSinceUpdate = lastUpdated ? Math.floor((now - lastUpdated) / 1000) : null;

  return (
    <div className="glass-card overflow-hidden" data-testid="price-chart-card">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-secondary" />
          <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Live Price Chart</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isFlashing ? "#FFFFFF" : "#14F195",
                boxShadow: isFlashing ? "0 0 10px #FFFFFF" : "0 0 6px #14F195",
                transition: "background 0.3s, box-shadow 0.3s",
              }}
            />
            <span className="text-xs font-bold" style={{ color: "#14F195" }}>
              LIVE
            </span>
            {elapsedSinceUpdate !== null && (
              <span className="text-xs text-muted-foreground">
                · {elapsedSinceUpdate}s ago
              </span>
            )}
          </div>
        </div>

        {/* Time window tabs */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {tabs.map(tw => (
            <button
              key={tw}
              onClick={() => setTimeWindow(tw)}
              className="px-3 py-1.5 text-xs font-bold transition-colors"
              style={{
                background: timeWindow === tw ? "rgba(153,69,255,0.3)" : "transparent",
                color: timeWindow === tw ? "#9945FF" : "#8888aa",
                borderRight: tw !== "all" ? "1px solid rgba(255,255,255,0.06)" : undefined,
              }}
            >
              {WINDOW_LABELS[tw]}
            </button>
          ))}
        </div>
      </div>

      {/* Price + delta */}
      <div className="px-6 pt-4 pb-2 flex items-end justify-between">
        <div>
          <div
            className="text-4xl font-bold tracking-tight transition-colors"
            style={{
              color: isFlashing ? chartColor : "#FFFFFF",
              textShadow: isFlashing ? `0 0 30px ${chartColor}` : undefined,
              transition: "color 0.4s, text-shadow 0.4s",
            }}
          >
            {currentPrice != null ? formatPrice(currentPrice) : "—"}
          </div>
          {priceDelta !== 0 && displayed.length > 1 ? (
            <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold" style={{ color: chartColor }}>
              {isUp ? "▲" : "▼"}
              {" "}{Math.abs(priceDeltaPct).toFixed(4)}%
              <span className="text-xs font-normal" style={{ color: `${chartColor}aa` }}>
                ({isUp ? "+" : ""}{formatPrice(Math.abs(priceDelta))}) in window
              </span>
            </div>
          ) : displayed.length > 1 ? (
            <div className="text-sm text-muted-foreground mt-1">— flat in window</div>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{displayed.length} pt{displayed.length !== 1 ? "s" : ""}</div>
          <div className="text-xs text-muted-foreground">{WINDOW_LABELS[timeWindow]} window</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        {displayed.length < 2 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(153,69,255,0.15)", border: "1px solid rgba(153,69,255,0.3)" }}
            >
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-medium text-white">Collecting price data…</div>
              <div className="text-xs text-muted-foreground mt-1">
                {priceHistory.length === 0
                  ? "Waiting for first price update"
                  : `${priceHistory.length} point${priceHistory.length !== 1 ? "s" : ""} recorded — expand time window to see them`}
              </div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayedWithLabel} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id={`grad-${mintAddress.slice(0, 8)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: "#666688", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fill: "#666688", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatPrice(v)}
                width={84}
              />
              <Tooltip content={<CustomTooltip />} />
              {firstPrice != null && priceRange > 0 && (
                <ReferenceLine
                  y={firstPrice}
                  stroke="rgba(255,255,255,0.12)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              <Area
                type="monotoneX"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#grad-${mintAddress.slice(0, 8)})`}
                dot={false}
                activeDot={{ r: 4, fill: chartColor, stroke: "#0a0a0f", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
