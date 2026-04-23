import { useState, useEffect, useRef } from "react";
import { useSearchTokens, getSearchTokensQueryKey } from "@workspace/api-client-react";
import { Search, History, ArrowRight, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const SOL_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function isSolanaAddress(str: string) {
  return SOL_ADDRESS_REGEX.test(str.trim());
}

interface RecentEntry {
  address: string;
  symbol: string;
  logoURI?: string;
  isWallet?: boolean;
}

export function SearchBar({
  onSelect,
  onAddressPaste,
}: {
  onSelect: (mint: string) => void;
  onAddressPaste?: (address: string, asWallet: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jupiter_recent_searches");
      if (stored) setRecent(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const looksLikeAddress = isSolanaAddress(query.trim());

  const { data: searchData, isLoading: isSearching } = useSearchTokens(
    { query: debouncedQuery },
    {
      query: {
        enabled: debouncedQuery.length > 1 && !looksLikeAddress,
        queryKey: getSearchTokensQueryKey({ query: debouncedQuery }),
      },
    }
  );

  const saveRecent = (entry: RecentEntry) => {
    const updated = [entry, ...recent.filter((r) => r.address !== entry.address)].slice(0, 5);
    setRecent(updated);
    try { localStorage.setItem("jupiter_recent_searches", JSON.stringify(updated)); } catch {}
  };

  const handleSelectToken = (token: { address: string; symbol: string; logoURI?: string | null }) => {
    saveRecent({ address: token.address, symbol: token.symbol, logoURI: token.logoURI ?? undefined });
    setQuery("");
    setIsOpen(false);
    onSelect(token.address);
  };

  const handleViewAsToken = () => {
    const addr = query.trim();
    saveRecent({ address: addr, symbol: addr.slice(0, 6) + "...", isWallet: false });
    setQuery("");
    setIsOpen(false);
    onSelect(addr);
  };

  const handleViewAsWallet = () => {
    const addr = query.trim();
    saveRecent({ address: addr, symbol: "Wallet", isWallet: true });
    setQuery("");
    setIsOpen(false);
    if (onAddressPaste) onAddressPaste(addr, true);
    else onSelect(addr);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim().length > 0) {
      if (looksLikeAddress) {
        handleViewAsToken();
      }
    }
    if (e.key === "Escape") setIsOpen(false);
  };

  const showDropdown = isOpen && query.length > 1;

  return (
    <div className="w-full max-w-2xl mx-auto relative flex flex-col gap-4" ref={containerRef}>
      <div className="relative search-focus-wrap rounded-xl border border-border transition-colors">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="Search token name, symbol, or paste mint/wallet address..."
          className="w-full h-14 pl-12 pr-4 bg-card/50 border-0 focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50 rounded-xl"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          data-testid="search-input"
        />
      </div>

      {showDropdown && (
        <Card
          className="absolute top-16 left-0 right-0 z-50 glass-card max-h-96 overflow-y-auto p-2"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          data-testid="search-results-dropdown"
        >
          {/* Address mode: show token + wallet options */}
          {looksLikeAddress ? (
            <div className="flex flex-col gap-1 p-1">
              <p className="text-xs text-muted-foreground px-2 py-1 font-mono truncate">{query.trim()}</p>
              <button
                className="flex items-center gap-3 p-3 w-full hover:bg-white/5 rounded-lg transition-colors text-left"
                onClick={handleViewAsToken}
                data-testid="view-as-token-button"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(124,95,255,0.2)", color: "#7c5fff" }}>
                  <Search className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">View as Token</div>
                  <div className="text-xs text-muted-foreground">Load token health dashboard for this mint address</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                className="flex items-center gap-3 p-3 w-full hover:bg-white/5 rounded-lg transition-colors text-left"
                onClick={handleViewAsWallet}
                data-testid="view-as-wallet-button"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,245,212,0.15)", color: "#00f5d4" }}>
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">View as Wallet</div>
                  <div className="text-xs text-muted-foreground">Show all token holdings for this wallet address</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : isSearching ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-8 h-8 rounded-full bg-white/5" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24 bg-white/5" />
                    <Skeleton className="h-3 w-16 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchData?.results && searchData.results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {searchData.results.map((token) => (
                <button
                  key={token.address}
                  className="flex items-center gap-3 p-3 w-full hover:bg-white/5 rounded-lg transition-colors text-left group"
                  onClick={() => handleSelectToken(token)}
                >
                  {token.logoURI ? (
                    <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full object-cover bg-black/20 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{token.name}</div>
                    <div className="text-xs text-muted-foreground">{token.symbol}</div>
                  </div>
                  {token.verified && (
                    <span className="text-xs" style={{ color: "#7c5fff" }}>✓</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No tokens found for "{query}"
            </div>
          )}
        </Card>
      )}

      {recent.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center justify-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <History className="w-3 h-3" /> Recent:
          </span>
          {recent.map((entry) => (
            <button
              key={entry.address}
              onClick={() => {
                if (entry.isWallet) {
                  if (onAddressPaste) onAddressPaste(entry.address, true);
                  else onSelect(entry.address);
                } else {
                  onSelect(entry.address);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              data-testid={`recent-chip-${entry.symbol}`}
            >
              {entry.isWallet ? (
                <Wallet className="w-3 h-3 text-secondary" />
              ) : entry.logoURI ? (
                <img src={entry.logoURI} alt={entry.symbol} className="w-4 h-4 rounded-full object-cover" />
              ) : null}
              {entry.symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
