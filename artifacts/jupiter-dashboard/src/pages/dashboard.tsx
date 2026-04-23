import { useState, useEffect, useRef, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { PriceChartCard } from "@/components/PriceChart";
import { MarketStatsPanel } from "@/components/MarketStats";
import { ParticleBackground } from "@/components/ParticleBackground";
import {
  useGetTokenMetadata,
  useGetTokenPrice,
  useGetWalletPortfolio,
  getGetTokenMetadataQueryKey,
  getGetTokenPriceQueryKey,
  getGetWalletPortfolioQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Droplets,
  Layers,
  Wallet,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

const SOL_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const HERO_COINS = [
  {
    symbol: "SOL",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    spriteClass: "coin-sol",
    fallbackColor: "#7c5fff",
  },
  {
    symbol: "JUP",
    logo: "https://static.jup.ag/jup/icon.png",
    spriteClass: "coin-jup",
    fallbackColor: "#00f5d4",
  },
  {
    symbol: "WIF",
    logo: "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link/",
    spriteClass: "coin-wif",
    fallbackColor: "#ff2d78",
  },
  {
    symbol: "USDC",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    spriteClass: "coin-usdc",
    fallbackColor: "#2775CA",
  },
] as const;

function HeroCoin({ symbol, logo, spriteClass, fallbackColor }: typeof HERO_COINS[number]) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <span className={`coin-sprite ${spriteClass}`}>
      <span className="coin-img-wrap">
        {!imgFailed && (
          <img
            src={logo}
            alt={symbol}
            onError={() => setImgFailed(true)}
            style={{ display: imgFailed ? "none" : "block" }}
          />
        )}
        {imgFailed && (
          <span
            className="coin-img-fallback"
            style={{
              background: `${fallbackColor}25`,
              color: fallbackColor,
              fontFamily: "'Orbitron', monospace",
              fontWeight: 900,
              fontSize: "0.5rem",
            }}
          >
            {symbol.slice(0, 3)}
          </span>
        )}
      </span>
      <span className="coin-label">{symbol}</span>
    </span>
  );
}

function isSolanaAddress(str: string) {
  return SOL_ADDRESS_REGEX.test(str.trim());
}

function formatNumber(value: number | null | undefined, prefix = ""): string {
  if (value == null) return "N/A — not provided by API";
  if (value >= 1_000_000_000)
    return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000)
    return `${prefix}${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(2)}K`;
  return `${prefix}${value.toFixed(2)}`;
}

function formatPrice(price: string | number | null | undefined): string {
  if (price == null || price === "") return "N/A";
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(n)) return "N/A";
  if (n === 0) return "$0.00";
  if (n < 0.000001) return `$${n.toExponential(4)}`;
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function truncateAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function getScoreColor(score: number | null): string {
  if (score == null) return "#8888aa";
  if (score >= 90) return "#00f5d4";
  if (score >= 70) return "#4488ff";
  if (score >= 50) return "#ffb86c";
  return "#FF4444";
}

function getScoreLabel(score: number | null): string {
  if (score == null) return "Unknown";
  if (score >= 90) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "MIXED";
  return "CAUTION";
}

function getHealthRating(
  verified: boolean,
  score: number | null
): { label: string; color: string; icon: string } {
  if (verified && score != null && score > 70)
    return { label: "SAFE TO MONITOR", color: "#00f5d4", icon: "✓" };
  if (verified && score != null && score >= 50)
    return { label: "MODERATE RISK", color: "#ffb86c", icon: "⚠" };
  return { label: "HIGH RISK — Trade with caution", color: "#FF4444", icon: "✗" };
}

function highlightJson(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (m) =>
      /:$/.test(m)
        ? `<span style="color:#8888aa">${m}</span>`
        : `<span style="color:#00f5d4">${m}</span>`
    )
    .replace(/\b(true|false)\b/g, `<span style="color:#ffb86c">$1</span>`)
    .replace(/\bnull\b/g, `<span style="color:#FF4444">null</span>`)
    .replace(/\b(-?\d+\.?\d*)\b/g, `<span style="color:#7c5fff">$1</span>`);
}

function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return value;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="text-muted-foreground hover:text-primary transition-colors ml-1"
      title="Copy address"
      data-testid="copy-address-button"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-secondary" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function CircularProgressRing({ score }: { score: number | null }) {
  const animated = useAnimatedNumber(score ?? 0);
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, animated)) / 100) * circ;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <circle
            cx="80" cy="80" r={r} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dashoffset 0.1s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {score == null ? "—" : Math.round(animated)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">/ 100</span>
        </div>
      </div>
      <div
        className="text-sm font-bold tracking-widest px-3 py-1 rounded-full"
        style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}
      >
        {getScoreLabel(score)}
      </div>
    </div>
  );
}

function PriceCard({ mintAddress }: { mintAddress: string }) {
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(10);
  const [prevPrice, setPrevPrice] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<{ pct: number; dir: "up" | "down" | "same" } | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  const { data, isLoading, error } = useGetTokenPrice(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenPriceQueryKey(mintAddress) },
  });

  const currentPrice = data?.price ?? null;

  useEffect(() => {
    if (currentPrice && prevPrice && currentPrice !== prevPrice) {
      const curr = parseFloat(currentPrice), prev = parseFloat(prevPrice);
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
    setCountdown(10);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          queryClient.invalidateQueries({ queryKey: getGetTokenPriceQueryKey(mintAddress) });
          return 10;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mintAddress, queryClient]);

  return (
    <div
      className="glass-card p-6 flex flex-col gap-5"
      style={{
        background: flash === "up" ? "rgba(20,241,149,0.06)" : flash === "down" ? "rgba(255,68,68,0.06)" : undefined,
        transition: "background 0.5s ease",
      }}
      data-testid="price-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Live Price</span>
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
          <span
            className="font-orbitron text-5xl font-bold tracking-tight"
            style={{
              color: flash === "up" ? "#14F195" : flash === "down" ? "#FF4444" : "#FFFFFF",
              transition: "color 0.5s",
              textShadow: flash
                ? `0 0 20px ${flash === "up" ? "#14F195" : "#FF4444"}, 0 0 50px ${flash === "up" ? "rgba(20,241,149,0.4)" : "rgba(255,68,68,0.4)"}`
                : "0 0 15px rgba(255,255,255,0.2)",
            }}
          >
            {formatPrice(currentPrice)}
          </span>

          {priceChange && priceChange.dir !== "same" ? (
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: priceChange.dir === "up" ? "#14F195" : "#FF4444" }}>
              {priceChange.dir === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {priceChange.dir === "up" ? "↑" : "↓"} {priceChange.pct.toFixed(4)}% since last refresh
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">— 0.00% change</div>
          )}
        </>
      )}

      <div className="space-y-1.5 mt-auto">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Refreshing in {countdown}s...</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(countdown / 10) * 100}%`,
              background: "linear-gradient(90deg,#7c5fff,#00f5d4)",
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface TokenMeta {
  address: string; name: string; symbol: string;
  logoURI?: string | null; verified: boolean; decimals: number;
  tags: string[]; organicScore?: number | null; organicScoreLabel?: string | null;
  daily_volume?: number | null; created_at?: string | null;
  market_cap?: number | null; fdv?: number | null;
  holder_count?: number | null; liquidity?: number | null;
}

function HeroTokenCard({ token }: { token: TokenMeta }) {
  const health = getHealthRating(token.verified, token.organicScore ?? null);

  return (
    <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-6" data-testid="token-card">
      <div className="relative flex-shrink-0">
        <div className="relative w-20 h-20">
          <div className="logo-glow-ring" />
          <div className="absolute inset-[3px] rounded-full overflow-hidden" style={{ background: "#020008" }}>
            {token.logoURI ? (
              <img src={token.logoURI} alt={token.symbol} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold font-orbitron" style={{ background: "rgba(124,95,255,0.2)", color: "#7c5fff" }}>
                {token.symbol.slice(0, 2)}
              </div>
            )}
          </div>
        </div>
        {token.verified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#7c5fff", boxShadow: "0 0 12px #7c5fff, 0 0 24px rgba(124,95,255,0.5)" }}>
            ✓
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">{token.name}</h1>
          <span className="text-lg text-muted-foreground font-mono">{token.symbol}</span>
          {token.verified ? (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: "#7c5fff", background: "rgba(124,95,255,0.15)", border: "1px solid rgba(124,95,255,0.4)", boxShadow: "0 0 8px rgba(124,95,255,0.25)" }}>
              ✓ VERIFIED
            </span>
          ) : (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: "#ffb86c", background: "rgba(255,184,108,0.12)", border: "1px solid rgba(255,184,108,0.4)" }}>
              ⚠ UNVERIFIED
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground font-mono">
          {truncateAddr(token.address)}
          <CopyButton text={token.address} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Decimals: <span className="text-white font-mono">{token.decimals}</span></span>
          {token.created_at && (
            <span>Created: <span className="text-white">{new Date(token.created_at).toLocaleDateString()}</span></span>
          )}
        </div>

        {token.tags && token.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {token.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#8888aa" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
          style={{ color: health.color, background: `${health.color}18`, border: `1px solid ${health.color}40`, boxShadow: `0 0 12px ${health.color}25` }}
          data-testid="health-rating"
        >
          {health.icon} {health.label}
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">Token Health Rating</div>
      </div>
    </div>
  );
}

function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el!.style.transform = `perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.02)`;
    }
    function onLeave() {
      el!.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref]);
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  const isNA = value.startsWith("N/A");
  const cardRef = useRef<HTMLDivElement>(null);
  useTilt(cardRef);
  const accentClass = color === "#00f5d4" ? "metric-card-green"
    : color === "#7c5fff" ? "metric-card-purple"
    : color === "#ff2d78" ? "metric-card-pink"
    : color === "#ffb86c" ? "metric-card-amber"
    : "";
  return (
    <div
      ref={cardRef}
      className={`glass-card tilt-card p-5 flex flex-col gap-3 ${accentClass}`}
      data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: color ?? "#8888aa", filter: color ? `drop-shadow(0 0 4px ${color})` : undefined }} />
        <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">{label}</span>
      </div>
      <div
        className={`font-bold font-orbitron ${isNA ? "text-muted-foreground text-xs" : "text-xl"}`}
        style={!isNA && color ? { color, textShadow: `0 0 12px ${color}66` } : undefined}
      >
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

function WalletLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card p-6 space-y-3">
        <Skeleton className="h-6 w-64 bg-white/5" />
        <Skeleton className="h-4 w-32 bg-white/5" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full bg-white/5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 bg-white/5" />
              <Skeleton className="h-3 w-16 bg-white/5" />
            </div>
            <Skeleton className="h-6 w-20 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletPortfolioView({
  walletAddress,
  onTokenClick,
}: {
  walletAddress: string;
  onTokenClick: (mint: string) => void;
}) {
  const [rawOpen, setRawOpen] = useState(false);
  const { data, isLoading, error } = useGetWalletPortfolio(walletAddress, {
    query: { enabled: !!walletAddress, queryKey: getGetWalletPortfolioQueryKey(walletAddress) },
  });

  if (isLoading) return <WalletLoadingSkeleton />;

  if (error) {
    return (
      <div className="glass-card p-6 border-destructive/30" style={{ background: "rgba(255,68,68,0.06)" }} data-testid="error-card">
        <div className="flex items-center gap-2 mb-2 text-destructive font-bold">
          <AlertTriangle className="w-5 h-5" /> Wallet Error
        </div>
        <p className="text-destructive/80 text-sm font-mono">{(error as Error).message}</p>
      </div>
    );
  }

  if (!data) return null;

  const totalValue = data.totalUsdValue;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-0 duration-500" data-testid="wallet-portfolio">
      {/* Wallet Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Wallet className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Wallet Portfolio</h2>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
              {truncateAddr(walletAddress)}
              <CopyButton text={walletAddress} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Value</div>
            <div className="text-3xl font-bold" style={{ color: "#00f5d4" }}>
              {totalValue != null ? formatPrice(totalValue) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{data.tokenCount} token{data.tokenCount !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Holdings</span>
        </div>

        {data.holdings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No token holdings found in this wallet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.holdings.map((holding, idx) => (
              <div
                key={holding.mint}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors cursor-pointer group"
                onClick={() => holding.mint !== "SOL" && onTokenClick(holding.mint)}
                data-testid={`holding-row-${idx}`}
              >
                {/* Rank */}
                <span className="w-6 text-xs text-muted-foreground text-center">{idx + 1}</span>

                {/* Logo */}
                <div className="flex-shrink-0">
                  {holding.logoURI ? (
                    <img
                      src={holding.logoURI} alt={holding.symbol ?? ""}
                      className="w-10 h-10 rounded-full object-cover"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(124,95,255,0.2)", color: "#7c5fff" }}>
                      {(holding.symbol ?? "?").slice(0, 2)}
                    </div>
                  )}
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold group-hover:text-primary transition-colors">
                      {holding.name ?? holding.symbol ?? truncateAddr(holding.mint)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{holding.symbol ?? ""}</span>
                    {holding.verified === true && (
                      <ShieldCheck className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                    {holding.isFrozen && (
                      <span className="text-xs px-1.5 py-0.5 rounded text-destructive bg-destructive/15">FROZEN</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{truncateAddr(holding.mint)}</div>
                </div>

                {/* Organic Score */}
                <div className="hidden md:flex flex-col items-center w-16">
                  {holding.organicScore != null ? (
                    <>
                      <span className="text-xs font-bold" style={{ color: getScoreColor(holding.organicScore) }}>
                        {Math.round(holding.organicScore)}
                      </span>
                      <span className="text-xs text-muted-foreground">score</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Price */}
                <div className="hidden md:block text-right w-24">
                  <div className="text-sm font-medium">
                    {holding.usdPrice != null ? formatPrice(holding.usdPrice) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">per token</div>
                </div>

                {/* Amount & USD Value */}
                <div className="text-right w-32">
                  <div className="font-semibold text-white">
                    {holding.uiAmount >= 1_000_000
                      ? `${(holding.uiAmount / 1_000_000).toFixed(2)}M`
                      : holding.uiAmount >= 1_000
                      ? `${(holding.uiAmount / 1_000).toFixed(2)}K`
                      : holding.uiAmount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                  </div>
                  <div className="text-xs" style={{ color: holding.usdValue != null && holding.usdValue > 0 ? "#00f5d4" : "#8888aa" }}>
                    {holding.usdValue != null && holding.usdValue > 0
                      ? formatPrice(holding.usdValue)
                      : "unknown value"}
                  </div>
                </div>

                {holding.mint !== "SOL" && (
                  <ArrowLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rotate-180 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Data */}
      <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
        <CollapsibleTrigger
          className="w-full flex items-center justify-between glass-card px-6 py-4 hover:bg-white/5 transition-colors"
          data-testid="raw-data-toggle"
        >
          <span className="font-semibold text-sm text-muted-foreground tracking-widest uppercase">Raw API Data (for developers)</span>
          {rawOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="glass-card mt-2 p-6">
            <pre
              className="text-xs font-mono overflow-x-auto max-h-[400px] overflow-y-auto leading-relaxed"
              style={{ color: "#8888aa" }}
              dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(data.rawBalances, null, 2)) }}
              data-testid="raw-data-viewer"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function TokenDashboard({ mintAddress }: { mintAddress: string }) {
  const [rawOpen, setRawOpen] = useState(false);
  const { data: tokenData, isLoading, error } = useGetTokenMetadata(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenMetadataQueryKey(mintAddress) },
  });
  const { data: priceData } = useGetTokenPrice(mintAddress, {
    query: { enabled: !!mintAddress, queryKey: getGetTokenPriceQueryKey(mintAddress) },
  });

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="glass-card p-6" style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)" }} data-testid="error-card">
        <div className="flex items-center gap-2 mb-2 text-destructive font-bold">
          <AlertTriangle className="w-5 h-5" /> API Error
        </div>
        <p className="text-destructive/80 text-sm font-mono">{(error as Error).message}</p>
      </div>
    );
  }

  if (!tokenData) return null;

  const rawJson = JSON.stringify({ tokenMetadata: tokenData.rawResponse, price: priceData?.rawResponse ?? null }, null, 2);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-0 duration-500">
      <HeroTokenCard token={tokenData as TokenMeta} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <PriceChartCard mintAddress={mintAddress} />
        </div>
        <div className="glass-card p-6 flex flex-col items-center gap-4" data-testid="score-card">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Organic Score</span>
            <span className="text-xs text-muted-foreground">{tokenData.organicScoreLabel ?? "Unknown"}</span>
          </div>
          <CircularProgressRing score={tokenData.organicScore ?? null} />
          <p className="text-xs text-muted-foreground text-center">Measures authentic trading activity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard icon={BarChart3} label="24h Volume" value={formatNumber(tokenData.daily_volume, "$")} color="#7c5fff" />
        <MetricCard icon={DollarSign} label="Market Cap" value={formatNumber(tokenData.market_cap, "$")} color="#00f5d4" />
        <MetricCard icon={Layers} label="FDV" value={formatNumber(tokenData.fdv, "$")} color="#ffb86c" />
        <MetricCard icon={Droplets} label="Liquidity" value={formatNumber(tokenData.liquidity, "$")} color="#ff2d78" />
        <MetricCard icon={Users} label="Holders" value={tokenData.holder_count != null ? tokenData.holder_count.toLocaleString() : "N/A — not provided by API"} color="#7c5fff" />
      </div>

      <MarketStatsPanel mintAddress={mintAddress} />

      <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
        <CollapsibleTrigger
          className="w-full flex items-center justify-between glass-card px-6 py-4 hover:bg-white/5 transition-colors"
          data-testid="raw-data-toggle"
        >
          <span className="font-semibold text-sm text-muted-foreground tracking-widest uppercase">Raw API Data (for developers)</span>
          {rawOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="glass-card mt-2 p-6">
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

type ViewMode = "idle" | "token" | "wallet";

function AutoDetectView({
  address,
  onTokenClick,
}: {
  address: string;
  onTokenClick: (mint: string) => void;
}) {
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useGetTokenMetadata(address, {
    query: { enabled: !!address, queryKey: getGetTokenMetadataQueryKey(address) },
  });

  if (tokenLoading) return <LoadingSkeleton />;

  if (!tokenError && tokenData && tokenData.name) {
    return <TokenDashboard mintAddress={address} />;
  }

  return <WalletPortfolioView walletAddress={address} onTokenClick={onTokenClick} />;
}

export default function Dashboard() {
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("idle");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleSelect = useCallback((address: string) => {
    setSelected(address);
    setLastRefresh(new Date());
    if (isSolanaAddress(address)) {
      setViewMode("token");
    } else {
      setViewMode("token");
    }
  }, []);

  const handleAddressPaste = useCallback((address: string, asWallet: boolean) => {
    setSelected(address);
    setLastRefresh(new Date());
    setViewMode(asWallet ? "wallet" : "token");
  }, []);

  const handleTokenClick = useCallback((mint: string) => {
    setSelected(mint);
    setViewMode("token");
    setLastRefresh(new Date());
  }, []);

  const goHome = useCallback(() => {
    setSelected(null);
    setViewMode("idle");
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020008" }}>
      {/* Layered backgrounds */}
      <ParticleBackground />
      <div className="aurora-bg">
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>
      <div className="grid-overlay" />
      <div className="scanlines" />

      {/* Ticker tape */}
      <div className="relative z-30 border-b ticker-tape py-1.5" style={{ borderColor: "rgba(124,95,255,0.15)", background: "rgba(2,0,8,0.85)" }}>
        <div className="ticker-inner text-xs font-mono">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i}>
              <span style={{ color: "#7c5fff" }}>◈ SOL</span>&nbsp;
              <span style={{ color: "#14F195" }}>BONK</span>&nbsp;·&nbsp;
              <span style={{ color: "#00f5d4" }}>JUP</span>&nbsp;·&nbsp;
              <span style={{ color: "#ff2d78" }}>WIF</span>&nbsp;·&nbsp;
              <span style={{ color: "#ffb86c" }}>POPCAT</span>&nbsp;·&nbsp;
              <span style={{ color: "#14F195" }}>TRUMP</span>&nbsp;·&nbsp;
              <span style={{ color: "#7c5fff" }}>PEPE</span>&nbsp;·&nbsp;
              <span style={{ color: "#00f5d4" }}>DOGE</span>&nbsp;·&nbsp;
              <span style={{ color: "#ff2d78" }}>SHIB</span>&nbsp;·&nbsp;
              <span style={{ color: "#ffb86c" }}>FLOKI</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Top Bar */}
      <header className="relative z-40 px-6 py-4 flex items-center justify-between border-b sticky top-0" style={{ borderColor: "rgba(124,95,255,0.2)", background: "rgba(2,0,8,0.88)", backdropFilter: "blur(20px)" }}>
        <a href="/" className="group text-left" data-testid="logo-home-button">
          <div className="flex items-center gap-3">
            {/* Logo image */}
            <img
              src="/logo.png"
              alt="Token Health"
              style={{ height: 38, width: "auto", objectFit: "contain", maxWidth: 130, borderRadius: 8 }}
            />
            <div>
              <div
                className="font-orbitron text-lg font-bold tracking-wide glitch"
                data-text="SOLANA MEMECOIN HEALTH"
                style={{ color: "#FFFFFF", textShadow: "0 0 20px rgba(124,95,255,0.5)" }}
              >
                SOLANA MEMECOIN HEALTH
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#00f5d4", opacity: 0.7 }}>Real-time Solana intelligence</p>
            </div>
          </div>
        </a>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full live-dot" style={{ background: "#00f5d4", boxShadow: "0 0 10px #00f5d4, 0 0 20px rgba(0,245,212,0.5)" }} />
            <span className="text-xs font-bold tracking-widest neon-cyan">LIVE</span>
          </div>
          <div
            className="text-xs px-3 py-1.5 rounded-full font-semibold glow-btn badge-shimmer"
            style={{ border: "1px solid rgba(124,95,255,0.5)", color: "#7c5fff" }}
          >
            ⚡ Powered by Jupiter
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 px-4 md:px-6 py-8 max-w-6xl mx-auto w-full">
        <div className={`transition-all duration-500 ${selected ? "mb-8" : "flex items-center justify-center min-h-[58vh]"}`}>
          <div className={`${selected ? "max-w-2xl mx-auto" : "w-full flex flex-col items-center gap-8"}`}>
            {!selected && (
              <div className="text-center relative">
                {/* Orbiting Coin Sprites with real logos */}
                {HERO_COINS.map((coin) => (
                  <HeroCoin key={coin.symbol} {...coin} />
                ))}

                <div className="text-xs font-orbitron tracking-widest mb-4 neon-cyan opacity-80" style={{ letterSpacing: "0.3em" }}>
                  SOLANA · DEFI · MEME INTELLIGENCE
                </div>

                <h2
                  className="text-5xl md:text-7xl font-black mb-5 glitch gradient-text font-orbitron leading-tight"
                  data-text="TOKEN HEALTH DASHBOARD"
                  style={{ fontWeight: 900 }}
                >
                  TOKEN HEALTH<br />DASHBOARD
                </h2>

                <p className="max-w-lg mx-auto text-base mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Real-time Solana token intelligence — cut through the noise.
                </p>
                <p className="text-xs opacity-50" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Search any token or paste a wallet address to see all holdings
                </p>
              </div>
            )}
            <SearchBar onSelect={handleSelect} onAddressPaste={handleAddressPaste} />
          </div>
        </div>

        {selected && viewMode === "token" && (
          <AutoDetectView address={selected} onTokenClick={handleTokenClick} />
        )}
        {selected && viewMode === "wallet" && (
          <WalletPortfolioView walletAddress={selected} onTokenClick={handleTokenClick} />
        )}
      </main>

      {/* CTA Section */}
      {!selected && (
        <section className="relative z-10 cta-section py-16 px-6 text-center">
          <h3
            className="text-3xl md:text-4xl font-black font-orbitron mb-6"
            style={{ color: "#fff", textShadow: "0 0 30px rgba(124,95,255,0.5), 0 0 60px rgba(0,245,212,0.2)" }}
          >
            Know what&apos;s real.<br />
            <span className="gradient-text">Trade smarter.</span>
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            {[
              { label: "FREE", color: "#00f5d4" },
              { label: "NO LOGIN", color: "#7c5fff" },
              { label: "REAL-TIME", color: "#ff2d78" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="px-5 py-2 rounded-full text-sm font-bold font-orbitron tracking-widest"
                style={{ color, background: `${color}18`, border: `1px solid ${color}60`, boxShadow: `0 0 16px ${color}30` }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Powered By cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { name: "JUPITER API", icon: "◈", desc: "Token metadata, organic score & price data", color: "#7c5fff" },
              { name: "TRADINGVIEW", icon: "📈", desc: "Professional OHLCV candlestick charts", color: "#00f5d4" },
              { name: "ON-CHAIN DATA", icon: "⛓", desc: "Wallet balances & live DeFi analytics", color: "#ff2d78" },
            ].map(({ name, icon, desc, color }) => (
              <div
                key={name}
                className="glass-card source-card p-5 flex flex-col items-center gap-2 text-center"
                style={{ borderTop: `2px solid ${color}80`, boxShadow: `0 0 20px ${color}15` }}
              >
                <span className="text-2xl">{icon}</span>
                <span className="font-orbitron font-bold text-sm tracking-wider" style={{ color }}>{name}</span>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="relative z-10 px-6 py-4 border-t flex items-center justify-between text-xs" style={{ borderColor: "rgba(124,95,255,0.15)", background: "rgba(2,0,8,0.8)", color: "#8888aa" }}>
        <span>Data by Jupiter · DexScreener · GeckoTerminal</span>
        <span className="font-orbitron text-xs" style={{ color: "#7c5fff" }}>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}
