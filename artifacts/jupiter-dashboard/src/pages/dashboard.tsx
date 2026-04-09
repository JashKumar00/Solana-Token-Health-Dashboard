import { useState, useEffect, useRef, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { useGetTokenMetadata, useGetTokenPrice, getGetTokenMetadataQueryKey, getGetTokenPriceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Check, ChevronDown, ChevronUp, RefreshCw, TrendingUp, TrendingDown, Users, DollarSign, BarChart3, Droplets, Layers } from "lucide-react";

function formatNumber(value: number | null | undefined, prefix = ""): string {
  if (value == null) return "N/A — not provided by API";
  if (value >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(2)}K`;
  return `${prefix}${value.toFixed(2)}`;
}

function formatPrice(price: string | null | undefined): string {
  if (!price) return "N/A";
  const n = parseFloat(price);
  if (isNaN(n)) return "N/A";
  if (n < 0.00001) return `$${n.toFixed(10)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function truncateMint(mint: string): string {
  if (mint.length <= 12) return mint;
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

function getScoreColor(score: number | null): string {
  if (score == null) return "#8888aa";
  if (score >= 70) return "#14F195";
  if (score >= 40) return "#FFB800";
  return "#FF4444";
}

function getScoreLabel(score: number | null): string {
  if (score == null) return "Unknown";
  if (score >= 70) return "HEALTHY";
  if (score >= 40) return "CAUTION";
  return "RISKY";
}

function getHealthRating(verified: boolean, score: number | null): { label: string; color: string; icon: string } {
  if (verified && score != null && score > 70) {
    return { label: "SAFE TO MONITOR", color: "#14F195", icon: "✓" };
  }
  if (verified && score != null && score >= 40) {
    return { label: "MODERATE RISK", color: "#FFB800", icon: "⚠" };
  }
  return { label: "HIGH RISK — Trade with caution", color: "#FF4444", icon: "✗" };
}

function highlightJson(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
      if (/:$/.test(match)) {
        return `<span style="color:#8888aa">${match}</span>`;
      }
      return `<span style="color:#14F195">${match}</span>`;
    })
    .replace(/\b(true|false)\b/g, `<span style="color:#FFB800">$1</span>`)
    .replace(/\bnull\b/g, `<span style="color:#FF4444">null</span>`)
    .replace(/\b(-?\d+\.?\d*)\b/g, `<span style="color:#9945FF">$1</span>`);
}

function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    const start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (target - start) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return value;
}

function CircularProgressRing({ score }: { score: number | null }) {
  const animatedScore = useAnimatedNumber(score ?? 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, animatedScore));
  const offset = circumference - (pct / 100) * circumference;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
          />
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: "stroke-dashoffset 0.1s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: "rotate(0deg)" }}>
          <span className="text-4xl font-bold" style={{ color }}>
            {score == null ? "—" : Math.round(animatedScore)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">/ 100</span>
        </div>
      </div>
      <div
        className="text-sm font-bold tracking-widest px-3 py-1 rounded-full"
        style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}
      >
        {label}
      </div>
    </div>
  );
}

function PriceCard({ mintAddress }: { mintAddress: string }) {
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(30);
  const [prevPrice, setPrevPrice] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<{ pct: number; dir: "up" | "down" | "same" } | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  const { data, isLoading, error } = useGetTokenPrice(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenPriceQueryKey(mintAddress) }
  });

  const currentPrice = data?.price ?? null;

  useEffect(() => {
    if (currentPrice && prevPrice && currentPrice !== prevPrice) {
      const curr = parseFloat(currentPrice);
      const prev = parseFloat(prevPrice);
      if (!isNaN(curr) && !isNaN(prev) && prev !== 0) {
        const pct = ((curr - prev) / prev) * 100;
        const dir = pct > 0 ? "up" : pct < 0 ? "down" : "same";
        setPriceChange({ pct: Math.abs(pct), dir });
        setFlash(dir === "same" ? null : dir);
        setTimeout(() => setFlash(null), 1500);
      }
    }
    if (currentPrice) setPrevPrice(currentPrice);
  }, [currentPrice]);

  useEffect(() => {
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          queryClient.invalidateQueries({ queryKey: getGetTokenPriceQueryKey(mintAddress) });
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mintAddress, queryClient]);

  const flashBg = flash === "up" ? "rgba(20,241,149,0.08)" : flash === "down" ? "rgba(255,68,68,0.08)" : "";

  return (
    <div
      className="glass-card p-6 flex flex-col gap-5"
      style={{ background: flashBg ? flashBg : undefined, transition: "background 0.5s ease" }}
      data-testid="price-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Live Price</span>
        <RefreshCw className="w-4 h-4 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-48 bg-white/5" />
          <Skeleton className="h-4 w-24 bg-white/5" />
        </div>
      ) : error ? (
        <div className="text-destructive text-sm">
          Price Unavailable: {(error as Error).message}
        </div>
      ) : (
        <>
          <div className="flex items-end gap-3">
            <span
              className="text-5xl font-bold"
              style={{
                color: flash === "up" ? "#14F195" : flash === "down" ? "#FF4444" : "#FFFFFF",
                transition: "color 0.5s ease",
                textShadow: flash ? `0 0 20px ${flash === "up" ? "#14F195" : "#FF4444"}` : undefined,
              }}
            >
              {formatPrice(currentPrice)}
            </span>
          </div>

          {priceChange && priceChange.dir !== "same" && (
            <div
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: priceChange.dir === "up" ? "#14F195" : "#FF4444" }}
            >
              {priceChange.dir === "up" ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {priceChange.dir === "up" ? "↑" : "↓"} {priceChange.pct.toFixed(4)}% since last refresh
            </div>
          )}
          {(!priceChange || priceChange.dir === "same") && (
            <div className="text-sm text-muted-foreground">— 0.00% change</div>
          )}
        </>
      )}

      <div className="space-y-1.5 mt-auto">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Refreshing in {countdown}s...</span>
          <span>{countdown}s</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(countdown / 30) * 100}%`,
              background: "linear-gradient(90deg, #9945FF, #14F195)",
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function OrganicScoreCard({ score, label }: { score: number | null; label: string | null }) {
  return (
    <div className="glass-card p-6 flex flex-col items-center gap-4" data-testid="score-card">
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Organic Score</span>
        <span className="text-xs text-muted-foreground">{label ?? "Unknown"}</span>
      </div>
      <CircularProgressRing score={score} />
      <p className="text-xs text-muted-foreground text-center">
        Measures authentic trading activity and community engagement
      </p>
    </div>
  );
}

interface TokenMeta {
  address: string;
  name: string;
  symbol: string;
  logoURI?: string | null;
  verified: boolean;
  decimals: number;
  tags: string[];
  organicScore?: number | null;
  organicScoreLabel?: string | null;
  daily_volume?: number | null;
  created_at?: string | null;
  market_cap?: number | null;
  fdv?: number | null;
  holder_count?: number | null;
  liquidity?: number | null;
}

function HeroTokenCard({ token }: { token: TokenMeta }) {
  const [copied, setCopied] = useState(false);
  const health = getHealthRating(token.verified, token.organicScore ?? null);

  const handleCopy = () => {
    navigator.clipboard.writeText(token.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-6" data-testid="token-card">
      <div className="relative flex-shrink-0">
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            className="w-20 h-20 rounded-full object-cover"
            style={{
              boxShadow: "0 0 20px rgba(153,69,255,0.4), 0 0 40px rgba(153,69,255,0.2)",
              border: "2px solid rgba(153,69,255,0.4)",
            }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              background: "rgba(153,69,255,0.2)",
              boxShadow: "0 0 20px rgba(153,69,255,0.4)",
              border: "2px solid rgba(153,69,255,0.4)",
              color: "#9945FF",
            }}
          >
            {token.symbol.slice(0, 2)}
          </div>
        )}
        {token.verified && (
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "#9945FF", boxShadow: "0 0 10px #9945FF" }}
          >
            ✓
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-white">{token.name}</h1>
          <span className="text-lg text-muted-foreground font-mono font-medium">{token.symbol}</span>
          {token.verified ? (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: "#9945FF", background: "rgba(153,69,255,0.15)", border: "1px solid rgba(153,69,255,0.4)", boxShadow: "0 0 8px rgba(153,69,255,0.3)" }}
            >
              ✓ VERIFIED
            </span>
          ) : (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: "#FFB800", background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.4)" }}
            >
              ⚠ UNVERIFIED
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-sm">{truncateMint(token.address)}</span>
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-primary transition-colors"
            data-testid="copy-mint-button"
            title="Copy mint address"
          >
            {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Decimals: <span className="text-white font-mono">{token.decimals}</span></span>
          {token.created_at && (
            <span>Created: <span className="text-white">{new Date(token.created_at).toLocaleDateString()}</span></span>
          )}
        </div>

        {token.tags && token.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {token.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#8888aa" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
          style={{
            color: health.color,
            background: `${health.color}18`,
            border: `1px solid ${health.color}40`,
            boxShadow: `0 0 12px ${health.color}30`,
          }}
          data-testid="health-rating"
        >
          <span>{health.icon}</span>
          <span>{health.label}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-2">Token Health Rating</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: color ?? "#8888aa" }} />
        <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">{label}</span>
      </div>
      <div className={`text-xl font-bold ${value === "N/A — not provided by API" ? "text-muted-foreground text-sm" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card p-6">
        <div className="flex gap-6 items-center">
          <Skeleton className="w-20 h-20 rounded-full bg-white/5" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48 bg-white/5" />
            <Skeleton className="h-4 w-32 bg-white/5" />
            <Skeleton className="h-4 w-64 bg-white/5" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <Skeleton className="h-4 w-24 bg-white/5" />
          <Skeleton className="h-12 w-48 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
        </div>
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          <Skeleton className="h-4 w-24 bg-white/5" />
          <Skeleton className="w-40 h-40 rounded-full bg-white/5" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <Skeleton className="h-4 w-16 bg-white/5" />
            <Skeleton className="h-6 w-24 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenDashboard({ mintAddress }: { mintAddress: string }) {
  const [rawOpen, setRawOpen] = useState(false);

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useGetTokenMetadata(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenMetadataQueryKey(mintAddress) }
  });

  const { data: priceData } = useGetTokenPrice(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenPriceQueryKey(mintAddress) }
  });

  if (tokenLoading) return <LoadingSkeleton />;

  if (tokenError) {
    return (
      <div className="glass-card p-6 border-destructive/50 bg-destructive/10" data-testid="error-card">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-destructive font-bold text-lg">API Error</span>
        </div>
        <p className="text-destructive/80 text-sm font-mono">{(tokenError as Error).message}</p>
      </div>
    );
  }

  if (!tokenData) return null;

  const combinedRaw = {
    tokenMetadata: tokenData.rawResponse,
    price: priceData?.rawResponse ?? null,
  };

  const rawJson = JSON.stringify(combinedRaw, null, 2);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-0 duration-500">
      <HeroTokenCard token={tokenData as TokenMeta} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PriceCard mintAddress={mintAddress} />
        <OrganicScoreCard score={tokenData.organicScore ?? null} label={tokenData.organicScoreLabel ?? null} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={BarChart3} label="24h Volume" value={formatNumber(tokenData.daily_volume, "$")} color="#9945FF" />
        <MetricCard icon={DollarSign} label="Market Cap" value={formatNumber(tokenData.market_cap, "$")} color="#14F195" />
        <MetricCard icon={Layers} label="FDV" value={formatNumber(tokenData.fdv, "$")} color="#FFB800" />
        <MetricCard icon={Droplets} label="Liquidity" value={formatNumber(tokenData.liquidity, "$")} color="#14F195" />
        <MetricCard icon={Users} label="Holders" value={tokenData.holder_count != null ? tokenData.holder_count.toLocaleString() : "N/A — not provided by API"} color="#9945FF" />
      </div>

      <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
        <CollapsibleTrigger
          className="w-full flex items-center justify-between glass-card px-6 py-4 hover:bg-white/5 transition-colors"
          data-testid="raw-data-toggle"
        >
          <span className="font-semibold text-sm text-muted-foreground tracking-widest uppercase">Raw API Data (for developers)</span>
          {rawOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="glass-card mt-2 p-6 overflow-hidden">
            <pre
              className="text-xs font-mono overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed"
              style={{ color: "#8888aa" }}
              dangerouslySetInnerHTML={{ __html: highlightJson(rawJson) }}
              data-testid="raw-data-viewer"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function Dashboard() {
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleSelect = useCallback((mint: string) => {
    setSelectedMint(mint);
    setLastRefresh(new Date());
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
      {/* Top Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "#1a1a2e" }}>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold"
              style={{ color: "#9945FF", textShadow: "0 0 20px rgba(153,69,255,0.6)", filter: "drop-shadow(0 0 8px #9945FF)" }}
            >
              ◈
            </span>
            <span className="text-xl font-bold text-white">Jupiter Token Health</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time token intelligence powered by Jupiter APIs</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full live-dot"
              style={{ background: "#14F195", boxShadow: "0 0 6px #14F195" }}
            />
            <span className="text-xs font-bold text-secondary tracking-widest">LIVE</span>
          </div>
          <div
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ background: "rgba(153,69,255,0.15)", border: "1px solid rgba(153,69,255,0.3)", color: "#9945FF" }}
          >
            Powered by Jupiter
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {/* Search */}
        <div className={`transition-all duration-500 ${selectedMint ? "mb-8" : "flex items-center justify-center min-h-[60vh]"}`}>
          <div className={`${selectedMint ? "max-w-2xl mx-auto" : "w-full flex flex-col items-center gap-6"}`}>
            {!selectedMint && (
              <div className="text-center mb-4">
                <h2 className="text-4xl font-bold text-white mb-3" style={{ textShadow: "0 0 40px rgba(153,69,255,0.3)" }}>
                  Token Health Dashboard
                </h2>
                <p className="text-muted-foreground">Search any Solana token to get real-time health metrics and live price data</p>
              </div>
            )}
            <SearchBar onSelect={handleSelect} />
          </div>
        </div>

        {/* Dashboard Panels */}
        {selectedMint && <TokenDashboard mintAddress={selectedMint} />}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t flex items-center justify-between text-xs text-muted-foreground" style={{ borderColor: "#1a1a2e" }}>
        <span>Data provided by Jupiter Developer Platform — developers.jup.ag</span>
        <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}
