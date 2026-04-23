export default function Slide06TechStack() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "#080c16" }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #14f195 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #14f195 0px, transparent 1px, transparent 60px)",
        }}
      />

      <div className="relative z-10 px-[7vw] pt-[7vh] pb-[4vh]">
        <span
          className="font-body font-medium tracking-[0.3em] uppercase block mb-[1.5vh]"
          style={{ fontSize: "1.5vw", color: "#14f195" }}
        >
          Tech Stack
        </span>
        <h2
          className="font-display font-bold tracking-tight"
          style={{ fontSize: "3.5vw", color: "#e8edf5" }}
        >
          Modern full-stack TypeScript
        </h2>
      </div>

      <div className="relative z-10 flex gap-[3vw] px-[7vw] pb-[7vh] flex-1">
        <div
          className="flex-1 flex flex-col gap-[1.5vh] p-[3vh_2.5vw] rounded-xl"
          style={{ background: "#0f1729", border: "1px solid #1a2540" }}
        >
          <p
            className="font-display font-semibold mb-[1vh]"
            style={{ fontSize: "1.8vw", color: "#14f195" }}
          >
            Frontend
          </p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>React 19 + Vite</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>Tailwind CSS</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>TanStack Query</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>TradingView lightweight-charts</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>TypeScript</p>
        </div>

        <div
          className="flex-1 flex flex-col gap-[1.5vh] p-[3vh_2.5vw] rounded-xl"
          style={{ background: "#0f1729", border: "1px solid #1a2540" }}
        >
          <p
            className="font-display font-semibold mb-[1vh]"
            style={{ fontSize: "1.8vw", color: "#9945ff" }}
          >
            Backend
          </p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>Express.js</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>TypeScript</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>OpenAPI spec + codegen</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>Drizzle ORM + PostgreSQL</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>pnpm monorepo</p>
        </div>

        <div
          className="flex-1 flex flex-col gap-[1.5vh] p-[3vh_2.5vw] rounded-xl"
          style={{ background: "#0f1729", border: "1px solid #1a2540" }}
        >
          <p
            className="font-display font-semibold mb-[1vh]"
            style={{ fontSize: "1.8vw", color: "#14f195", opacity: 0.8 }}
          >
            Infrastructure
          </p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>Replit deployment</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>GitHub source control</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>10-second auto-refresh</p>
          <p className="font-body" style={{ fontSize: "1.7vw", color: "#e8edf5" }}>Solana mainnet</p>
        </div>
      </div>
    </div>
  );
}
