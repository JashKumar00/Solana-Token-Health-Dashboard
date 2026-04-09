import { useState } from "react";
import { useGetMarketData, getGetMarketDataQueryKey } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, ExternalLink, Activity, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Timeframe = "m5" | "h1" | "h6" | "h24";
type TxnBlock = { buys: number; sells: number; volume?: number | null; priceChange?: number | null };

function formatNum(n: number | null | undefined, prefix = ""): string {
  if (n == null || n === 0) return "—";
  if (n >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

function formatPct(n: number | null | undefined): { text: string; up: boolean } {
  if (n == null) return { text: "—", up: true };
  return { text: `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`, up: n >= 0 };
}

function BuySellBar({ buys, sells }: { buys: number; sells: number }) {
  const total = buys + sells;
  if (total === 0) return <div className="h-2 rounded-full bg-white/5 w-full" />;
  const buyPct = (buys / total) * 100;
  return (
    <div className="relative h-2 rounded-full overflow-hidden bg-white/5">
      <div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{ width: `${buyPct}%`, background: "linear-gradient(90deg, #14F195, #14F19588)" }}
      />
      <div
        className="absolute right-0 top-0 h-full"
        style={{ width: `${100 - buyPct}%`, background: "rgba(255,68,68,0.5)" }}
      />
    </div>
  );
}

function TimeframeCard({
  label,
  stat,
  active,
  onClick,
}: {
  label: string;
  stat: TxnBlock;
  active: boolean;
  onClick: () => void;
}) {
  const { text, up } = formatPct(stat.priceChange);
  const total = stat.buys + stat.sells;
  const buyRatio = total > 0 ? Math.round((stat.buys / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-4 rounded-xl transition-all text-left"
      style={{
        background: active ? "rgba(153,69,255,0.15)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? "rgba(153,69,255,0.4)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: active ? "0 0 20px rgba(153,69,255,0.15)" : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground tracking-widest">{label}</span>
        <span
          className="text-sm font-bold"
          style={{ color: up ? "#14F195" : "#FF4444" }}
        >
          {text}
        </span>
      </div>
      <BuySellBar buys={stat.buys} sells={stat.sells} />
      <div className="flex justify-between text-xs">
        <span style={{ color: "#14F195" }}>B: {stat.buys.toLocaleString()}</span>
        <span className="text-muted-foreground">{buyRatio}% buy</span>
        <span style={{ color: "#FF4444" }}>S: {stat.sells.toLocaleString()}</span>
      </div>
      {stat.volume != null && (
        <div className="text-xs text-muted-foreground">
          Vol: <span className="text-white">{formatNum(stat.volume, "$")}</span>
        </div>
      )}
    </button>
  );
}

const DEX_COLORS: Record<string, string> = {
  raydium: "#00D4A0",
  orca: "#9945FF",
  meteora: "#FF6B35",
  pump: "#FFB800",
  openbook: "#14F195",
  jupiter: "#FFAA00",
  lifinity: "#FF44AA",
  phoenix: "#44AAFF",
  drift: "#AA44FF",
};

function getDexColor(dexId: string): string {
  const key = dexId.toLowerCase();
  for (const [prefix, color] of Object.entries(DEX_COLORS)) {
    if (key.includes(prefix)) return color;
  }
  return "#8888aa";
}

export function MarketStatsPanel({ mintAddress }: { mintAddress: string }) {
  const [activeTab, setActiveTab] = useState<Timeframe>("h1");

  const { data, isLoading } = useGetMarketData(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetMarketDataQueryKey(mintAddress) },
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <Skeleton className="h-4 w-32 bg-white/5" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const timeframes: { key: Timeframe; label: string }[] = [
    { key: "m5", label: "5M" },
    { key: "h1", label: "1H" },
    { key: "h6", label: "6H" },
    { key: "h24", label: "24H" },
  ];

  const activeStat = data.txns?.[activeTab] as TxnBlock | undefined;
  const activeVolume = data.volume?.[activeTab] ?? null;

  const dexVolumeData = data.topPairs
    .filter(p => (p.volume24h ?? 0) > 0)
    .reduce<Record<string, number>>((acc, p) => {
      const key = p.dexId.toLowerCase().replace(/-/g, "_");
      acc[key] = (acc[key] ?? 0) + (p.volume24h ?? 0);
      return acc;
    }, {});

  const dexChartData = Object.entries(dexVolumeData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([dex, vol]) => ({ dex: dex.slice(0, 10), volume: vol, color: getDexColor(dex) }));

  const totalActiveTxns = activeStat ? activeStat.buys + activeStat.sells : 0;

  return (
    <div className="flex flex-col gap-4" data-testid="market-stats-panel">
      {/* Timeframe Cards */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Market Activity</span>
          <span className="text-xs text-muted-foreground ml-auto">{data.pairCount} active pair{data.pairCount !== 1 ? "s" : ""}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {timeframes.map(({ key, label }) => {
            const stat = data.txns?.[key] as TxnBlock | undefined;
            if (!stat) return null;
            return (
              <TimeframeCard
                key={key}
                label={label}
                stat={{ ...stat, volume: data.volume?.[key] ?? null }}
                active={activeTab === key}
                onClick={() => setActiveTab(key)}
              />
            );
          })}
        </div>

        {activeStat && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {timeframes.find(t => t.key === activeTab)?.label} Trading Pressure
              </span>
              <span className="text-xs text-muted-foreground">{totalActiveTxns.toLocaleString()} total trades</span>
            </div>

            <div className="relative h-6 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              {totalActiveTxns > 0 && (
                <>
                  <div
                    className="absolute left-0 top-0 h-full flex items-center justify-center text-xs font-bold"
                    style={{
                      width: `${(activeStat.buys / totalActiveTxns) * 100}%`,
                      background: "linear-gradient(90deg, rgba(20,241,149,0.4), rgba(20,241,149,0.2))",
                      color: "#14F195",
                      minWidth: activeStat.buys > 0 ? 40 : 0,
                    }}
                  >
                    {activeStat.buys > 0 && `${Math.round((activeStat.buys / totalActiveTxns) * 100)}%`}
                  </div>
                  <div
                    className="absolute right-0 top-0 h-full flex items-center justify-center text-xs font-bold"
                    style={{
                      width: `${(activeStat.sells / totalActiveTxns) * 100}%`,
                      background: "linear-gradient(270deg, rgba(255,68,68,0.4), rgba(255,68,68,0.2))",
                      color: "#FF4444",
                      minWidth: activeStat.sells > 0 ? 40 : 0,
                    }}
                  >
                    {activeStat.sells > 0 && `${Math.round((activeStat.sells / totalActiveTxns) * 100)}%`}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span style={{ color: "#14F195" }}>◀ {activeStat.buys.toLocaleString()} BUYS</span>
              {activeVolume != null && <span>Vol: {formatNum(activeVolume, "$")}</span>}
              <span style={{ color: "#FF4444" }}>{activeStat.sells.toLocaleString()} SELLS ▶</span>
            </div>
          </div>
        )}
      </div>

      {/* DEX Volume Breakdown */}
      {dexChartData.length > 0 && (
        <div className="glass-card p-5" data-testid="dex-breakdown">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">24H Volume by DEX</span>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dexChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="dex"
                  tick={{ fill: "#8888aa", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#8888aa", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatNum(v, "$")}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="glass-card px-3 py-2 text-xs" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                        <div className="text-muted-foreground">{payload[0].payload?.dex}</div>
                        <div className="font-bold text-white mt-0.5">{formatNum(payload[0].value as number, "$")}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {dexChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Pairs / Liquidity Sources */}
      <div className="glass-card overflow-hidden" data-testid="top-pairs">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Top Trading Pairs</span>
          </div>
          <span className="text-xs text-muted-foreground">Sorted by liquidity</span>
        </div>

        <div className="divide-y divide-white/5">
          {data.topPairs.slice(0, 8).map((pair, idx) => {
            const { text, up } = formatPct(pair.priceChange24h);
            const color = getDexColor(pair.dexId);
            const txns = pair.txns24h ?? { buys: 0, sells: 0 };
            const total24h = txns.buys + txns.sells;
            const buyRatio = total24h > 0 ? Math.round((txns.buys / total24h) * 100) : 0;

            return (
              <div key={pair.pairAddress} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/3 transition-colors">
                <span className="w-5 text-xs text-muted-foreground text-center">{idx + 1}</span>

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                >
                  {pair.dexId.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold capitalize">{pair.dexId}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {pair.pairAddress.slice(0, 8)}…{pair.pairAddress.slice(-6)}
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-end w-20">
                  <div className="text-xs font-semibold" style={{ color: up ? "#14F195" : "#FF4444" }}>{text}</div>
                  <div className="text-xs text-muted-foreground">24h chg</div>
                </div>

                <div className="hidden md:flex flex-col items-end w-24">
                  <div className="text-xs font-semibold text-white">{formatNum(pair.volume24h, "$")}</div>
                  <div className="text-xs" style={{ color: "#8888aa" }}>Vol 24h</div>
                </div>

                <div className="flex flex-col items-end w-24">
                  <div className="text-xs font-semibold text-white">{formatNum(pair.liquidity, "$")}</div>
                  <div className="text-xs text-muted-foreground">Liquidity</div>
                </div>

                <div className="hidden lg:flex flex-col items-end w-20">
                  <div className="flex gap-1 text-xs">
                    <span style={{ color: "#14F195" }}>B:{txns.buys.toLocaleString()}</span>
                    <span className="text-muted-foreground">/</span>
                    <span style={{ color: "#FF4444" }}>S:{txns.sells.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{buyRatio}% buy</div>
                </div>

                {pair.url && (
                  <a
                    href={pair.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Traders proxy: largest single trades by avg size */}
      {data.topPairs.length > 0 && (
        <div className="glass-card p-5" data-testid="trading-intelligence">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Trading Intelligence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.topPairs.slice(0, 3).map((pair) => {
              const pt = pair.txns24h ?? { buys: 0, sells: 0 };
              const total = pt.buys + pt.sells;
              const avgSize = total > 0 && pair.volume24h ? pair.volume24h / total : null;
              const sentiment = pt.buys > pt.sells ? "bullish" : "bearish";
              const sentimentColor = sentiment === "bullish" ? "#14F195" : "#FF4444";
              const pressure = total > 0 ? ((pt.buys - pt.sells) / total * 100) : 0;
              const color = getDexColor(pair.dexId);

              return (
                <div
                  key={pair.pairAddress}
                  className="p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                        style={{ background: `${color}20`, color }}
                      >
                        {pair.dexId.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold capitalize">{pair.dexId}</span>
                    </div>
                    <span
                      className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ color: sentimentColor, background: `${sentimentColor}18` }}
                    >
                      {sentiment}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Trade Size</span>
                      <span className="font-semibold text-white">{avgSize != null ? formatNum(avgSize, "$") : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buy Pressure</span>
                      <span className="font-semibold" style={{ color: pressure >= 0 ? "#14F195" : "#FF4444" }}>
                        {pressure >= 0 ? "+" : ""}{pressure.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Trades</span>
                      <span className="font-semibold text-white">{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h PnL Est.</span>
                      <span className="font-semibold" style={{ color: pair.priceChange24h != null && pair.priceChange24h >= 0 ? "#14F195" : "#FF4444" }}>
                        {pair.priceChange24h != null ? `${pair.priceChange24h >= 0 ? "+" : ""}${pair.priceChange24h.toFixed(2)}%` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
