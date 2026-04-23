const base = import.meta.env.BASE_URL;

export default function Slide05DataSources() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex"
      style={{ background: "#080c16" }}
    >
      <div className="relative z-10 flex flex-col justify-center px-[8vw] py-[8vh] w-full">
        <span
          className="font-body font-medium tracking-[0.3em] uppercase block mb-[3vh]"
          style={{ fontSize: "1.5vw", color: "#14f195" }}
        >
          Data Layer
        </span>
        <h2
          className="font-display font-bold tracking-tight leading-tight mb-[7vh]"
          style={{ fontSize: "3.8vw", color: "#e8edf5" }}
        >
          Three APIs.
          <br />
          One source of truth.
        </h2>

        <div className="flex gap-[3vw]">
          <div
            className="flex-1 flex flex-col items-start p-[3.5vh_2.5vw] rounded-xl"
            style={{ background: "#0f1729", border: "1px solid #1a2540" }}
          >
            <div
              className="w-[6vw] h-[6vw] rounded-xl overflow-hidden mb-[2.5vh]"
              style={{ background: "#080c16", border: "1px solid #1a2540" }}
            >
              <img
                src={`${base}logo-jupiter.png`}
                crossOrigin="anonymous"
                alt="Jupiter"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-display font-semibold mb-[1.5vh]" style={{ fontSize: "2vw", color: "#e8edf5" }}>
              Jupiter API
            </p>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3", lineHeight: "1.5" }}>
              Token metadata, pricing, organic scores, market stats and wallet holdings
            </p>
          </div>

          <div
            className="flex-1 flex flex-col items-start p-[3.5vh_2.5vw] rounded-xl"
            style={{ background: "#0f1729", border: "1px solid #1a2540" }}
          >
            <div
              className="w-[6vw] h-[6vw] rounded-xl overflow-hidden mb-[2.5vh]"
              style={{ background: "#080c16", border: "1px solid #1a2540" }}
            >
              <img
                src={`${base}logo-dexscreener.png`}
                crossOrigin="anonymous"
                alt="DexScreener"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-display font-semibold mb-[1.5vh]" style={{ fontSize: "2vw", color: "#e8edf5" }}>
              DexScreener
            </p>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3", lineHeight: "1.5" }}>
              DEX pool data, trading pair metadata, volume and liquidity breakdowns
            </p>
          </div>

          <div
            className="flex-1 flex flex-col items-start p-[3.5vh_2.5vw] rounded-xl"
            style={{ background: "#0f1729", border: "1px solid #1a2540" }}
          >
            <div
              className="w-[6vw] h-[6vw] rounded-xl overflow-hidden mb-[2.5vh]"
              style={{ background: "#080c16", border: "1px solid #1a2540" }}
            >
              <img
                src={`${base}logo-geckoterminal.png`}
                crossOrigin="anonymous"
                alt="GeckoTerminal"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-display font-semibold mb-[1.5vh]" style={{ fontSize: "2vw", color: "#e8edf5" }}>
              GeckoTerminal
            </p>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3", lineHeight: "1.5" }}>
              Full OHLCV historical candlestick data across all supported timeframes
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
