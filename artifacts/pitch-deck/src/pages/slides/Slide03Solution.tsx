const base = import.meta.env.BASE_URL;

export default function Slide03Solution() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex"
      style={{ background: "#080c16" }}
    >
      <div
        className="absolute bottom-0 left-0 w-[50vw] h-[50vh] opacity-[0.07]"
        style={{
          background: "radial-gradient(ellipse at 0% 100%, #14f195 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 flex flex-col justify-center px-[7vw] py-[8vh]"
        style={{ width: "48vw" }}
      >
        <span
          className="font-body font-medium tracking-[0.3em] uppercase mb-[3vh] block"
          style={{ fontSize: "1.5vw", color: "#14f195" }}
        >
          The Solution
        </span>
        <h2
          className="font-display font-bold tracking-tight leading-tight mb-[4vh]"
          style={{ fontSize: "4vw", color: "#e8edf5" }}
        >
          One terminal.
          <br />
          Every signal.
        </h2>
        <p
          className="font-body leading-relaxed mb-[5vh]"
          style={{ fontSize: "1.8vw", color: "#8896b3", maxWidth: "36vw" }}
        >
          A unified intelligence layer for Solana token research — price action,
          quality signals, and portfolio data in a single professional dashboard
          built for serious traders.
        </p>

        <div className="flex flex-col gap-[2vh]">
          <div className="flex items-center gap-[1.5vw]">
            <div
              className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0"
              style={{ background: "#14f195" }}
            />
            <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>
              Real-time OHLCV candlestick charts
            </p>
          </div>
          <div className="flex items-center gap-[1.5vw]">
            <div
              className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0"
              style={{ background: "#9945ff" }}
            />
            <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>
              Jupiter organic quality scoring
            </p>
          </div>
          <div className="flex items-center gap-[1.5vw]">
            <div
              className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0"
              style={{ background: "#14f195" }}
            />
            <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>
              Full wallet portfolio analytics
            </p>
          </div>
        </div>
      </div>

      <div
        className="relative z-10 flex items-center justify-center py-[6vh] pr-[5vw]"
        style={{ flex: 1 }}
      >
        <div
          className="w-full h-full rounded-xl overflow-hidden"
          style={{
            border: "1px solid #1a2540",
            boxShadow: "0 0 60px 0 #14f19515",
          }}
        >
          <img
            src={`${base}dashboard-screenshot.jpg`}
            crossOrigin="anonymous"
            alt="Jupiter Token Health Dashboard"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}
