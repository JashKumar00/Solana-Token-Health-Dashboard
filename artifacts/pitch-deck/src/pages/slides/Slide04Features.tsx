export default function Slide04Features() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "#080c16" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-30"
        style={{ background: "linear-gradient(90deg, transparent, #14f195, transparent)" }}
      />

      <div className="px-[7vw] pt-[7vh] pb-[3vh]">
        <span
          className="font-body font-medium tracking-[0.3em] uppercase block mb-[1.5vh]"
          style={{ fontSize: "1.5vw", color: "#14f195" }}
        >
          Core Features
        </span>
        <h2
          className="font-display font-bold tracking-tight"
          style={{ fontSize: "3.5vw", color: "#e8edf5" }}
        >
          Built for depth, designed for speed
        </h2>
      </div>

      <div className="flex-1 flex gap-[2vw] px-[7vw] pb-[7vh]">
        <div
          className="flex-1 flex flex-col p-[3vh_2.5vw] rounded-xl"
          style={{ background: "#0f1729", border: "1px solid #1a2540" }}
        >
          <div
            className="w-[4vw] h-[4vw] rounded-lg flex items-center justify-center mb-[2.5vh]"
            style={{ background: "#14f19520" }}
          >
            <span
              className="font-display font-bold"
              style={{ fontSize: "2vw", color: "#14f195" }}
            >
              01
            </span>
          </div>
          <h3
            className="font-display font-semibold mb-[1.5vh]"
            style={{ fontSize: "2vw", color: "#e8edf5" }}
          >
            Price Charts
          </h3>
          <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3", lineHeight: "1.6" }}>
            OHLCV candlestick charts with 1M, 5M, 15M, 1H, 4H and 1D timeframes. Dynamic
            precision for micro-cap tokens. Auto-fallback resolution.
          </p>
        </div>

        <div
          className="flex-1 flex flex-col p-[3vh_2.5vw] rounded-xl"
          style={{ background: "#0f1729", border: "1px solid #1a2540" }}
        >
          <div
            className="w-[4vw] h-[4vw] rounded-lg flex items-center justify-center mb-[2.5vh]"
            style={{ background: "#9945ff20" }}
          >
            <span
              className="font-display font-bold"
              style={{ fontSize: "2vw", color: "#9945ff" }}
            >
              02
            </span>
          </div>
          <h3
            className="font-display font-semibold mb-[1.5vh]"
            style={{ fontSize: "2vw", color: "#e8edf5" }}
          >
            Organic Score
          </h3>
          <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3", lineHeight: "1.6" }}>
            Jupiter's proprietary quality signal distinguishing genuine market activity
            from wash trading, bots, and manipulation.
          </p>
        </div>

        <div
          className="flex-1 flex flex-col p-[3vh_2.5vw] rounded-xl"
          style={{ background: "#0f1729", border: "1px solid #1a2540" }}
        >
          <div
            className="w-[4vw] h-[4vw] rounded-lg flex items-center justify-center mb-[2.5vh]"
            style={{ background: "#14f19520" }}
          >
            <span
              className="font-display font-bold"
              style={{ fontSize: "2vw", color: "#14f195" }}
            >
              03
            </span>
          </div>
          <h3
            className="font-display font-semibold mb-[1.5vh]"
            style={{ fontSize: "2vw", color: "#e8edf5" }}
          >
            Wallet Analytics
          </h3>
          <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3", lineHeight: "1.6" }}>
            Search any Solana wallet address to view full token holdings, USD values,
            and portfolio composition at a glance.
          </p>
        </div>
      </div>
    </div>
  );
}
