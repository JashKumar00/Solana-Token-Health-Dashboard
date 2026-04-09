import { useState, useEffect } from "react";
import { useSearchTokens, getSearchTokensQueryKey } from "@workspace/api-client-react";
import { Search, History, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function SearchBar({ onSelect }: { onSelect: (mint: string) => void }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recent, setRecent] = useState<{address: string, symbol: string, logoURI?: string}[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jupiter_recent_searches");
      if (stored) setRecent(JSON.parse(stored));
    } catch (e) {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchData, isLoading: isSearching } = useSearchTokens(
    { query: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 1, queryKey: getSearchTokensQueryKey({ query: debouncedQuery }) } }
  );

  const handleSelect = (token: {address: string, symbol: string, logoURI?: string}) => {
    const newRecent = [token, ...recent.filter(r => r.address !== token.address)].slice(0, 5);
    setRecent(newRecent);
    try {
      localStorage.setItem("jupiter_recent_searches", JSON.stringify(newRecent));
    } catch (e) {}
    setQuery("");
    setIsOpen(false);
    onSelect(token.address);
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative flex flex-col gap-4">
      <div className="relative group animate-border-gradient rounded-xl overflow-hidden border border-border transition-colors">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="Search token name, symbol, or paste mint address..."
          className="w-full h-14 pl-12 pr-4 bg-card/50 border-0 focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          data-testid="search-input"
        />
      </div>

      {isOpen && query.length > 1 && (
        <Card className="absolute top-16 left-0 right-0 z-50 glass-card max-h-96 overflow-y-auto p-2 border-border/50" data-testid="search-results-dropdown">
          {isSearching ? (
            <div className="space-y-2 p-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
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
                  className="flex items-center gap-3 p-3 w-full hover:bg-white/5 rounded-lg transition-colors text-left"
                  onClick={() => handleSelect({ address: token.address, symbol: token.symbol, logoURI: token.logoURI || undefined })}
                >
                  {token.logoURI ? (
                    <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full bg-black/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{token.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{token.symbol}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No tokens found.
            </div>
          )}
        </Card>
      )}

      {recent.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center justify-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <History className="w-3 h-3" /> Recent:
          </span>
          {recent.map((token) => (
            <button
              key={token.address}
              onClick={() => onSelect(token.address)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-medium"
            >
              {token.logoURI && <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />}
              {token.symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
