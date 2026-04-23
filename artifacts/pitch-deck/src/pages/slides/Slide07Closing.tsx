const base = import.meta.env.BASE_URL;

export default function Slide07Closing() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-center items-center"
      style={{ background: "#080c16" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #14f19510 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-[0.3vh]"
        style={{ background: "linear-gradient(90deg, transparent, #14f195, transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[0.3vh]"
        style={{ background: "linear-gradient(90deg, transparent, #9945ff, transparent)" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-[10vw]">
        <p
          className="font-display font-bold tracking-tight leading-tight mb-[4vh]"
          style={{ fontSize: "5.5vw", color: "#e8edf5" }}
        >
          Built for signal hunters.
        </p>

        <p
          className="font-body mb-[6vh] max-w-[50vw] leading-relaxed"
          style={{ fontSize: "1.9vw", color: "#8896b3" }}
        >
          An open-source project bringing professional-grade token intelligence
          to every Solana trader, builder, and researcher.
        </p>

        <div
          className="px-[3vw] py-[2vh] rounded-xl"
          style={{ background: "#0f1729", border: "1px solid #1a2540" }}
        >
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#8896b3" }}>
            github.com/JashKumar00/Solana-Token-Health-Dashboard
          </p>
        </div>

        <div className="mt-[6vh] flex gap-[6vw]">
          <div className="text-center">
            <p className="font-display font-bold" style={{ fontSize: "3.5vw", color: "#14f195" }}>
              6
            </p>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3" }}>
              API endpoints
            </p>
          </div>
          <div
            className="w-[0.1vw]"
            style={{ background: "#1a2540" }}
          />
          <div className="text-center">
            <p className="font-display font-bold" style={{ fontSize: "3.5vw", color: "#9945ff" }}>
              6
            </p>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3" }}>
              Chart timeframes
            </p>
          </div>
          <div
            className="w-[0.1vw]"
            style={{ background: "#1a2540" }}
          />
          <div className="text-center">
            <p className="font-display font-bold" style={{ fontSize: "3.5vw", color: "#14f195" }}>
              10s
            </p>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#8896b3" }}>
              Refresh rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
