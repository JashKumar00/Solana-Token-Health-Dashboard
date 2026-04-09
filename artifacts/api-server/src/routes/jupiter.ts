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

export default router;
