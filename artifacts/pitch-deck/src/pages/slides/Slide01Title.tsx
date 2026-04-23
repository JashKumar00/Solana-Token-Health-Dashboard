const base = import.meta.env.BASE_URL;

export default function Slide01Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src={`${base}hero-bg.png`}
        crossOrigin="anonymous"
        alt="Blockchain network visualization"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#080c16]/90 via-[#080c16]/75 to-[#080c16]/60" />

      <div className="relative z-10 flex flex-col justify-center h-full px-[8vw] pt-[6vh] pb-[8vh]">
        <div className="mb-[3vh]">
          <span
            className="inline-block font-body text-[1.5vw] font-medium tracking-[0.3em] uppercase"
            style={{ color: "#14f195" }}
          >
            Solana Token Intelligence
          </span>
        </div>

        <h1
          className="font-display font-bold tracking-tight leading-none"
          style={{ fontSize: "6.5vw", color: "#e8edf5" }}
        >
          Jupiter Token
        </h1>
        <h1
          className="font-display font-bold tracking-tight leading-none mb-[4vh]"
          style={{ fontSize: "6.5vw", color: "#14f195" }}
        >
          Health Dashboard
        </h1>

        <p
          className="font-body font-normal max-w-[45vw] leading-relaxed"
          style={{ fontSize: "1.9vw", color: "#8896b3" }}
        >
          Real-time candlestick charts, organic scores, wallet analytics and market
          intelligence — all in one Bloomberg-meets-DeFi terminal.
        </p>

        <div className="absolute bottom-[6vh] right-[8vw] text-right">
          <p className="font-body" style={{ fontSize: "1.5vw", color: "#8896b3" }}>
            April 2026
          </p>
          <p className="font-body" style={{ fontSize: "1.5vw", color: "#8896b3" }}>
            github.com/JashKumar00
          </p>
        </div>
      </div>
    </div>
  );
}
