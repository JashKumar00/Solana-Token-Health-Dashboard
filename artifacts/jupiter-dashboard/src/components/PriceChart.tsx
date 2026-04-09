import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { useGetTokenPrice, getGetTokenPriceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Zap } from "lucide-react";

interface PricePoint {
  time: string;
  price: number;
  timestamp: number;
}

type TimeWindow = "1m" | "5m" | "15m" | "all";

function formatPrice(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.000001) return `$${n.toExponential(4)}`;
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
      <div className="text-muted-foreground">{label}</div>
      <div className="font-bold text-white mt-0.5">{formatPrice(payload[0].value)}</div>
    </div>
  );
}

export function PriceChartCard({ mintAddress }: { mintAddress: string }) {
  const queryClient = useQueryClient();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("5m");
  const [isFlashing, setIsFlashing] = useState(false);
  const latestPriceRef = useRef<number | null>(null);

  const { data } = useGetTokenPrice(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenPriceQueryKey(mintAddress) },
  });

  const currentPrice = data?.price ? parseFloat(data.price) : null;

  const addPricePoint = useCallback((price: number) => {
    const now = Date.now();
    const point: PricePoint = {
      time: formatTime(now),
      price,
      timestamp: now,
    };
    setPriceHistory(prev => {
      const maxPoints = 1000;
      const next = [...prev, point];
      return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
    });
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 400);
  }, []);

  useEffect(() => {
    if (currentPrice != null && currentPrice !== latestPriceRef.current) {
      latestPriceRef.current = currentPrice;
      addPricePoint(currentPrice);
    }
  }, [currentPrice, addPricePoint]);

  useEffect(() => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          queryClient.invalidateQueries({ queryKey: getGetTokenPriceQueryKey(mintAddress) });
          return 5;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mintAddress, queryClient]);

  const now = Date.now();
  const windowMs: Record<TimeWindow, number> = {
    "1m": 60_000,
    "5m": 5 * 60_000,
    "15m": 15 * 60_000,
    "all": Infinity,
  };

  const filtered = timeWindow === "all"
    ? priceHistory
    : priceHistory.filter(p => now - p.timestamp <= windowMs[timeWindow]);

  const displayed = filtered.length > 200 ? filtered.filter((_, i) => i % Math.ceil(filtered.length / 200) === 0) : filtered;

  const prices = displayed.map(p => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const firstPrice = displayed[0]?.price ?? null;
  const lastPrice = displayed[displayed.length - 1]?.price ?? null;
  const priceDelta = firstPrice && lastPrice ? lastPrice - firstPrice : 0;
  const priceDeltaPct = firstPrice && firstPrice > 0 ? (priceDelta / firstPrice) * 100 : 0;
  const isUp = priceDelta >= 0;
  const chartColor = isUp ? "#14F195" : "#FF4444";

  const tabs: TimeWindow[] = ["1m", "5m", "15m", "all"];

  return (
    <div className="glass-card overflow-hidden" data-testid="price-chart-card">
      <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-secondary" />
          <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Live Price Chart</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isFlashing ? "#FFFFFF" : "#14F195",
                boxShadow: isFlashing ? "0 0 8px #FFFFFF" : "0 0 6px #14F195",
                transition: "all 0.2s",
              }}
            />
            <span className="text-xs text-secondary font-bold">5s refresh</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            {tabs.map(tw => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className="px-3 py-1.5 text-xs font-bold transition-colors uppercase"
                style={{
                  background: timeWindow === tw ? "rgba(153,69,255,0.3)" : "transparent",
                  color: timeWindow === tw ? "#9945FF" : "#8888aa",
                }}
              >
                {tw}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            <span>{countdown}s</span>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4 pb-2 flex items-end gap-4">
        <div>
          <div className="text-3xl font-bold text-white">
            {currentPrice != null ? formatPrice(currentPrice) : "—"}
          </div>
          {priceDelta !== 0 && displayed.length > 1 && (
            <div className="flex items-center gap-1 mt-1 text-sm font-semibold" style={{ color: chartColor }}>
              {isUp ? "▲" : "▼"} {Math.abs(priceDeltaPct).toFixed(4)}% ({isUp ? "+" : ""}{formatPrice(Math.abs(priceDelta))}) in {timeWindow}
            </div>
          )}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {displayed.length} sample{displayed.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{ height: 200 }}>
        {displayed.length < 2 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ background: "rgba(153,69,255,0.2)" }}>
                <Zap className="w-4 h-4 text-primary" />
              </div>
              Collecting price data… {displayed.length > 0 ? "1 sample" : "waiting for first refresh"}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayed} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`chartGrad-${mintAddress.slice(0, 8)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: "#8888aa", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minPrice * 0.9998, maxPrice * 1.0002]}
                tick={{ fill: "#8888aa", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatPrice(v)}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              {firstPrice != null && (
                <ReferenceLine
                  y={firstPrice}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="4 4"
                />
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#chartGrad-${mintAddress.slice(0, 8)})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="px-6 pb-3 pt-1">
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${((5 - countdown) / 5) * 100}%`,
              background: `linear-gradient(90deg, #9945FF, #14F195)`,
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
