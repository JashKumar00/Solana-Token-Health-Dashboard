import { Router, type IRouter } from "express";

const router: IRouter = Router();

const JUPITER_API_BASE = "https://api.jup.ag";
const JUPITER_API_KEY =
  "jup_7418987a6c0b5083829ab9cac939ed84999b55a3d60912708f35405f7d408c90";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const jupiterHeaders = {
  "x-api-key": JUPITER_API_KEY,
  "Content-Type": "application/json",
};

async function jupiterFetch(
  path: string
): Promise<{ data: unknown; status: number }> {
  const url = `${JUPITER_API_BASE}${path}`;
  const response = await fetch(url, { headers: jupiterHeaders });

  const contentType = response.headers.get("content-type") ?? "";
  let data: unknown;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  return { data, status: response.status };
}

function mapTokenFromUltra(t: Record<string, unknown>) {
  return {
    address: t["id"] ?? t["address"] ?? "",
    name: t["name"] ?? "",
    symbol: t["symbol"] ?? "",
    logoURI: t["icon"] ?? t["logoURI"] ?? null,
    verified: t["isVerified"] ?? false,
    decimals: t["decimals"] ?? 0,
    tags: Array.isArray(t["tags"]) ? t["tags"] : [],
    organicScore:
      t["organicScore"] != null ? Number(t["organicScore"]) : null,
    organicScoreLabel: t["organicScoreLabel"] ?? null,
    daily_volume:
      (t["stats1h"] as Record<string, unknown> | undefined)?.["buyVolume"] !=
      null
        ? (
            Number(
              (t["stats1h"] as Record<string, unknown>)["buyVolume"]
            ) +
            Number(
              (t["stats1h"] as Record<string, unknown>)["sellVolume"]
            )
          ) * 24
        : null,
    created_at: t["createdAt"] ?? null,
    market_cap: t["mcap"] ?? null,
    fdv: t["fdv"] ?? null,
    holder_count: t["holderCount"] ?? null,
    liquidity: t["liquidity"] ?? null,
    usdPrice: t["usdPrice"] ?? null,
    stats5m: t["stats5m"] ?? null,
    stats1h: t["stats1h"] ?? null,
    stats6h: t["stats6h"] ?? null,
    stats24h: t["stats24h"] ?? null,
    circSupply: t["circSupply"] ?? null,
    totalSupply: t["totalSupply"] ?? null,
    audit: t["audit"] ?? null,
    twitter: t["twitter"] ?? null,
    website: t["website"] ?? null,
    discord: t["discord"] ?? null,
  };
}

router.get("/jupiter/search", async (req, res): Promise<void> => {
  const query = req.query["query"];
  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "query parameter is required" });
    return;
  }

  const { data, status } = await jupiterFetch(
    `/ultra/v1/search?query=${encodeURIComponent(query)}`
  );

  if (status === 401 || status === 403) {
    res.status(500).json({
      error: `Jupiter API returned ${status} — check your API key`,
      details: JSON.stringify(data),
    });
    return;
  }
  if (status === 429) {
    res.status(429).json({
      error: "Jupiter API rate limit hit — try again in a few seconds",
      details: JSON.stringify(data),
    });
    return;
  }
  if (status !== 200) {
    res.status(status).json({
      error: `Jupiter API returned ${status}`,
      details: JSON.stringify(data),
    });
    return;
  }

  const tokenList: unknown[] = Array.isArray(data) ? data : [];

  const results = tokenList.map((token: unknown) => {
    const t = token as Record<string, unknown>;
    return {
      address: t["id"] ?? t["address"] ?? "",
      name: t["name"] ?? "",
      symbol: t["symbol"] ?? "",
      logoURI: t["icon"] ?? t["logoURI"] ?? null,
      verified: t["isVerified"] ?? false,
      decimals: t["decimals"] ?? 0,
      tags: Array.isArray(t["tags"]) ? t["tags"] : [],
      organicScore:
        t["organicScore"] != null ? Number(t["organicScore"]) : null,
      daily_volume: null,
    };
  });

  res.json({ results, rawResponse: data });
});

router.get(
  "/jupiter/token/:mintAddress",
  async (req, res): Promise<void> => {
    const rawParam = req.params["mintAddress"];
    const mintAddress = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    if (!mintAddress) {
      res.status(400).json({ error: "mintAddress is required" });
      return;
    }

    const { data, status } = await jupiterFetch(
      `/ultra/v1/search?query=${mintAddress}`
    );

    if (status === 401 || status === 403) {
      res.status(500).json({
        error: `Jupiter API returned ${status} — check your API key`,
        details: JSON.stringify(data),
      });
      return;
    }
    if (status === 429) {
      res.status(429).json({
        error: "Jupiter API rate limit hit — try again in a few seconds",
        details: JSON.stringify(data),
      });
      return;
    }
    if (status !== 200) {
      res.status(status).json({
        error: `Jupiter API returned ${status}`,
        details: JSON.stringify(data),
      });
      return;
    }

    const tokenList: unknown[] = Array.isArray(data) ? data : [];

    const exact = tokenList.find((token: unknown) => {
      const t = token as Record<string, unknown>;
      return t["id"] === mintAddress || t["address"] === mintAddress;
    }) as Record<string, unknown> | undefined;

    if (!exact) {
      if (tokenList.length === 0) {
        res.status(404).json({
          error: `No token found for this address on Jupiter`,
          details: null,
        });
        return;
      }
      const t = tokenList[0] as Record<string, unknown>;
      const metadata = { ...mapTokenFromUltra(t), rawResponse: data };
      res.json(metadata);
      return;
    }

    const metadata = { ...mapTokenFromUltra(exact), rawResponse: data };
    res.json(metadata);
  }
);

router.get(
  "/jupiter/price/:mintAddress",
  async (req, res): Promise<void> => {
    const rawParam = req.params["mintAddress"];
    const mintAddress = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    if (!mintAddress) {
      res.status(400).json({ error: "mintAddress is required" });
      return;
    }

    if (mintAddress === USDC_MINT) {
      res.json({
        mintAddress,
        price: "1.0",
        priceData: {
          id: mintAddress,
          type: "derivedPrice",
          price: "1.0",
          extraInfo: null,
        },
        timeTaken: null,
        rawResponse: { note: "USDC is pegged to $1.00" },
      });
      return;
    }

    const searchResult = await jupiterFetch(
      `/ultra/v1/search?query=${mintAddress}`
    );

    if (
      searchResult.status === 200 &&
      Array.isArray(searchResult.data) &&
      searchResult.data.length > 0
    ) {
      const tokens = searchResult.data as Record<string, unknown>[];
      const exact = tokens.find(
        (t) => t["id"] === mintAddress || t["address"] === mintAddress
      );
      const token = exact ?? tokens[0];

      if (token && token["usdPrice"] != null) {
        res.json({
          mintAddress,
          price: String(token["usdPrice"]),
          priceData: {
            id: mintAddress,
            type: "derivedPrice",
            price: String(token["usdPrice"]),
            extraInfo: {
              stats5m: token["stats5m"] ?? null,
              stats1h: token["stats1h"] ?? null,
            },
          },
          timeTaken: null,
          rawResponse: searchResult.data,
        });
        return;
      }
    }

    const { data, status } = await jupiterFetch(
      `/swap/v1/quote?inputMint=${mintAddress}&outputMint=${USDC_MINT}&amount=1000000000&swapMode=ExactIn`
    );

    if (status === 401 || status === 403) {
      res.status(500).json({
        error: `Jupiter API returned ${status} — check your API key`,
        details: JSON.stringify(data),
      });
      return;
    }
    if (status === 429) {
      res.status(429).json({
        error: "Jupiter API rate limit hit — try again in a few seconds",
        details: JSON.stringify(data),
      });
      return;
    }
    if (status !== 200) {
      res.status(404).json({
        error: `Price Unavailable: Jupiter API returned ${status}`,
        details: JSON.stringify(data),
      });
      return;
    }

    const quote = data as Record<string, unknown>;
    const inAmount = Number(quote["inAmount"] ?? 0);
    const outAmount = Number(quote["outAmount"] ?? 0);
    const inputDecimals = 9;
    const usdcDecimals = 6;

    if (inAmount === 0) {
      res.status(404).json({
        error: "Price Unavailable: Could not compute price from swap quote",
        details: JSON.stringify(data),
      });
      return;
    }

    const priceUsd =
      (outAmount / Math.pow(10, usdcDecimals)) /
      (inAmount / Math.pow(10, inputDecimals));

    res.json({
      mintAddress,
      price: String(priceUsd),
      priceData: {
        id: mintAddress,
        type: "derivedPrice",
        price: String(priceUsd),
        extraInfo: null,
      },
      timeTaken: null,
      rawResponse: data,
    });
  }
);

const dexScreenerFetch = async (path: string) => {
  const url = `https://api.dexscreener.com${path}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  const data = await response.json();
  return { data, status: response.status };
};

router.get(
  "/jupiter/market/:mintAddress",
  async (req, res): Promise<void> => {
    const rawParam = req.params["mintAddress"];
    const mintAddress = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    if (!mintAddress) {
      res.status(400).json({ error: "mintAddress is required" });
      return;
    }

    const { data, status } = await dexScreenerFetch(
      `/latest/dex/tokens/${mintAddress}`
    );

    if (status !== 200) {
      res.status(status).json({ error: `DexScreener returned ${status}` });
      return;
    }

    const result = data as {
      pairs: Array<{
        dexId: string;
        pairAddress: string;
        url?: string;
        priceUsd?: string;
        priceNative?: string;
        priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
        txns?: { m5?: { buys: number; sells: number }; h1?: { buys: number; sells: number }; h6?: { buys: number; sells: number }; h24?: { buys: number; sells: number } };
        volume?: { m5?: number; h1?: number; h6?: number; h24?: number };
        liquidity?: { usd?: number; base?: number; quote?: number };
        fdv?: number;
        marketCap?: number;
        pairCreatedAt?: number;
      }>;
    };

    const pairs = result.pairs ?? [];

    if (pairs.length === 0) {
      res.status(404).json({ error: "No trading pairs found for this token" });
      return;
    }

    const sortedByLiquidity = [...pairs].sort(
      (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    );

    const bestPair = sortedByLiquidity[0];

    const aggregate = (key: "m5" | "h1" | "h6" | "h24") => {
      let buys = 0, sells = 0, volume = 0, priceChange = null as number | null;
      const pairsWithData = pairs.filter(p => p.txns?.[key]);
      for (const p of pairsWithData) {
        buys += p.txns?.[key]?.buys ?? 0;
        sells += p.txns?.[key]?.sells ?? 0;
        volume += p.volume?.[key] ?? 0;
      }
      if (bestPair?.priceChange?.[key] != null) priceChange = bestPair.priceChange[key] ?? null;
      return { buys, sells, volume: volume > 0 ? volume : null, priceChange };
    };

    const topPairs = sortedByLiquidity.slice(0, 10).map(p => ({
      dexId: p.dexId,
      pairAddress: p.pairAddress,
      priceUsd: p.priceUsd ?? null,
      liquidity: p.liquidity?.usd ?? null,
      volume24h: p.volume?.h24 ?? null,
      txns24h: {
        buys: p.txns?.h24?.buys ?? 0,
        sells: p.txns?.h24?.sells ?? 0,
      },
      priceChange24h: p.priceChange?.h24 ?? null,
      url: p.url ?? null,
    }));

    const totalLiquidity = pairs.reduce((sum, p) => sum + (p.liquidity?.usd ?? 0), 0);

    res.json({
      mintAddress,
      bestPriceUsd: bestPair?.priceUsd ?? null,
      priceChanges: {
        m5: bestPair?.priceChange?.m5 ?? null,
        h1: bestPair?.priceChange?.h1 ?? null,
        h6: bestPair?.priceChange?.h6 ?? null,
        h24: bestPair?.priceChange?.h24 ?? null,
      },
      txns: {
        m5: aggregate("m5"),
        h1: aggregate("h1"),
        h6: aggregate("h6"),
        h24: aggregate("h24"),
      },
      volume: {
        m5: pairs.reduce((s, p) => s + (p.volume?.m5 ?? 0), 0) || null,
        h1: pairs.reduce((s, p) => s + (p.volume?.h1 ?? 0), 0) || null,
        h6: pairs.reduce((s, p) => s + (p.volume?.h6 ?? 0), 0) || null,
        h24: pairs.reduce((s, p) => s + (p.volume?.h24 ?? 0), 0) || null,
      },
      topPairs,
      totalLiquidityUsd: totalLiquidity > 0 ? totalLiquidity : null,
      pairCount: pairs.length,
    });
  }
);

router.get(
  "/jupiter/wallet/:walletAddress",
  async (req, res): Promise<void> => {
    const rawParam = req.params["walletAddress"];
    const walletAddress = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress is required" });
      return;
    }

    const { data: balanceData, status: balanceStatus } = await jupiterFetch(
      `/ultra/v1/balances/${walletAddress}`
    );

    if (balanceStatus === 401 || balanceStatus === 403) {
      res.status(500).json({
        error: `Jupiter API returned ${balanceStatus} — check your API key`,
        details: JSON.stringify(balanceData),
      });
      return;
    }
    if (balanceStatus === 429) {
      res.status(429).json({
        error: "Jupiter API rate limit hit — try again in a few seconds",
        details: JSON.stringify(balanceData),
      });
      return;
    }
    if (balanceStatus !== 200) {
      res.status(balanceStatus).json({
        error: `Jupiter API returned ${balanceStatus}`,
        details: JSON.stringify(balanceData),
      });
      return;
    }

    const balances = balanceData as Record<
      string,
      { amount: string; uiAmount: number; slot: number; isFrozen: boolean }
    >;

    const mintKeys = Object.keys(balances).filter(
      (k) =>
        k !== "SOL" &&
        balances[k].uiAmount > 0
    );

    const solBalance = balances["SOL"];

    const topMints = mintKeys
      .sort((a, b) => balances[b].uiAmount - balances[a].uiAmount)
      .slice(0, 25);

    const metadataMap: Record<string, Record<string, unknown>> = {};

    await Promise.all(
      topMints.map(async (mint) => {
        try {
          const { data, status } = await jupiterFetch(
            `/ultra/v1/search?query=${mint}`
          );
          if (status === 200 && Array.isArray(data) && data.length > 0) {
            const tokens = data as Record<string, unknown>[];
            const exact = tokens.find(
              (t) => t["id"] === mint || t["address"] === mint
            );
            if (exact) {
              metadataMap[mint] = exact;
            } else {
              metadataMap[mint] = tokens[0];
            }
          }
        } catch {
        }
      })
    );

    const holdings: Array<{
      mint: string;
      amount: string;
      uiAmount: number;
      name: string | null;
      symbol: string | null;
      logoURI: string | null;
      verified: boolean | null;
      usdPrice: number | null;
      usdValue: number | null;
      organicScore: number | null;
      decimals: number | null;
      isFrozen: boolean;
    }> = [];

    if (solBalance && (solBalance.uiAmount > 0 || mintKeys.length === 0)) {
      const solMeta = metadataMap["SOL"] ?? null;
      const solPrice = solMeta ? Number(solMeta["usdPrice"] ?? 0) : null;

      let resolvedSolPrice = solPrice;
      if (!resolvedSolPrice) {
        try {
          const { data: solSearch } = await jupiterFetch(
            `/ultra/v1/search?query=SOL`
          );
          if (Array.isArray(solSearch) && solSearch.length > 0) {
            const solToken = (solSearch as Record<string, unknown>[]).find(
              (t) => t["symbol"] === "SOL" && t["isVerified"] === true
            );
            if (solToken) resolvedSolPrice = Number(solToken["usdPrice"] ?? 0);
          }
        } catch {}
      }

      holdings.push({
        mint: "SOL",
        amount: String(solBalance.amount),
        uiAmount: solBalance.uiAmount,
        name: "Solana",
        symbol: "SOL",
        logoURI:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        verified: true,
        usdPrice: resolvedSolPrice,
        usdValue:
          resolvedSolPrice != null
            ? solBalance.uiAmount * resolvedSolPrice
            : null,
        organicScore: 98,
        decimals: 9,
        isFrozen: solBalance.isFrozen,
      });
    }

    for (const mint of topMints) {
      const bal = balances[mint];
      const meta = metadataMap[mint];
      const usdPrice = meta ? Number(meta["usdPrice"] ?? 0) || null : null;
      const usdValue =
        usdPrice != null ? bal.uiAmount * usdPrice : null;

      holdings.push({
        mint,
        amount: String(bal.amount),
        uiAmount: bal.uiAmount,
        name: meta ? (meta["name"] as string) ?? null : null,
        symbol: meta ? (meta["symbol"] as string) ?? null : null,
        logoURI: meta ? ((meta["icon"] ?? meta["logoURI"]) as string) ?? null : null,
        verified: meta ? (meta["isVerified"] as boolean) ?? null : null,
        usdPrice,
        usdValue,
        organicScore: meta
          ? Number(meta["organicScore"] ?? 0) || null
          : null,
        decimals: meta ? Number(meta["decimals"] ?? 0) || null : null,
        isFrozen: bal.isFrozen,
      });
    }

    holdings.sort((a, b) => {
      const valA = a.usdValue ?? -1;
      const valB = b.usdValue ?? -1;
      if (valB !== valA) return valB - valA;
      return b.uiAmount - a.uiAmount;
    });

    const totalUsdValue = holdings.reduce(
      (sum, h) => (h.usdValue != null ? sum + h.usdValue : sum),
      0
    );

    res.json({
      walletAddress,
      totalUsdValue: totalUsdValue > 0 ? totalUsdValue : null,
      tokenCount: holdings.length,
      holdings,
      rawBalances: balanceData,
    });
  }
);

export default router;
