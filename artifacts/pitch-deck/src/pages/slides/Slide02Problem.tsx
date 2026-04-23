export default function Slide02Problem() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex"
      style={{ background: "#080c16" }}
    >
      <div
        className="absolute top-0 right-0 w-[40vw] h-full opacity-10"
        style={{
          background: "radial-gradient(ellipse at 80% 50%, #9945ff 0%, transparent 70%)",
        }}
      />

      <div className="flex-1 flex flex-col justify-center px-[8vw] py-[8vh]">
        <span
          className="font-body font-medium tracking-[0.3em] uppercase mb-[3vh] block"
          style={{ fontSize: "1.5vw", color: "#14f195" }}
        >
          The Challenge
        </span>
        <h2
          className="font-display font-bold tracking-tight leading-tight mb-[5vh]"
          style={{ fontSize: "4vw", color: "#e8edf5" }}
        >
          Too much noise.
          <br />
          Not enough signal.
        </h2>

        <div className="flex flex-col gap-[2.5vh]">
          <div className="flex items-start gap-[2vw]">
            <div
              className="flex-shrink-0 w-[0.5vw] h-[0.5vw] rounded-full mt-[0.8vw]"
              style={{ background: "#14f195" }}
            />
            <p className="font-body" style={{ fontSize: "1.9vw", color: "#8896b3" }}>
              Thousands of Solana tokens launch daily — most are noise
            </p>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div
              className="flex-shrink-0 w-[0.5vw] h-[0.5vw] rounded-full mt-[0.8vw]"
              style={{ background: "#14f195" }}
            />
            <p className="font-body" style={{ fontSize: "1.9vw", color: "#8896b3" }}>
              Price data is scattered across five different platforms
            </p>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div
              className="flex-shrink-0 w-[0.5vw] h-[0.5vw] rounded-full mt-[0.8vw]"
              style={{ background: "#14f195" }}
            />
            <p className="font-body" style={{ fontSize: "1.9vw", color: "#8896b3" }}>
              Wallet exposure and portfolio risk are invisible at a glance
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col justify-center items-center px-[6vw] border-l"
        style={{ width: "38vw", borderColor: "#0f1729" }}
      >
        <p
          className="font-display font-bold leading-none"
          style={{ fontSize: "10vw", color: "#9945ff" }}
        >
          10K+
        </p>
        <p
          className="font-body text-center mt-[2vh]"
          style={{ fontSize: "1.6vw", color: "#8896b3" }}
        >
          New Solana tokens
          <br />
          launched every day
        </p>
      </div>
    </div>
  );
}
