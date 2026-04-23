import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";

const EVM_ADDRESS = "0x44b3A9D938fbA6f0E4D545e1FC35dF3767d46eF4";
const SOL_ADDRESS = "FifvwoGhAtiNgJFjd86JHBVWZhQVwBC3W2rvMfVr53U7";

const BASE = import.meta.env.BASE_URL;

const EVM_CHAINS = [
  { symbol: "ETH", color: "#627EEA" },
  { symbol: "BNB", color: "#F3BA2F" },
  { symbol: "MATIC", color: "#8247E5" },
  { symbol: "ARB", color: "#12AAFF" },
  { symbol: "OP", color: "#FF0420" },
  { symbol: "AVAX", color: "#E84142" },
];

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  });
}

function ClickToCopyAddress({ address, accent }: { address: string; accent: string }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = () => {
    copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to copy"
      style={{
        cursor: "pointer",
        fontSize: "0.62rem",
        color: copied ? "#14F195" : hovered ? accent : "rgba(224,224,240,0.55)",
        wordBreak: "break-all",
        textAlign: "center",
        lineHeight: 1.7,
        padding: "10px 12px",
        borderRadius: "8px",
        border: `1px solid ${copied ? "rgba(20,241,149,0.4)" : hovered ? `${accent}44` : "rgba(255,255,255,0.06)"}`,
        background: copied ? "rgba(20,241,149,0.06)" : hovered ? `${accent}0d` : "rgba(255,255,255,0.02)",
        transition: "all 0.18s ease",
        userSelect: "none",
        position: "relative",
      }}
    >
      {copied ? (
        <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
          ✓ COPIED!
        </span>
      ) : (
        <>
          {address}
          <span style={{ display: "block", fontFamily: "'Orbitron', monospace", fontSize: "0.45rem", letterSpacing: "0.1em", opacity: 0.5, marginTop: "4px" }}>
            {hovered ? "CLICK TO COPY" : "TAP TO COPY"}
          </span>
        </>
      )}
    </div>
  );
}

function CopyButton({ address, accent }: { address: string; accent: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        fontFamily: "'Orbitron', monospace",
        fontWeight: 700,
        fontSize: "0.65rem",
        letterSpacing: "0.12em",
        padding: "10px 22px",
        borderRadius: "6px",
        border: `1px solid ${copied ? "#14F195" : accent}`,
        color: copied ? "#14F195" : accent,
        background: copied ? "rgba(20,241,149,0.08)" : "rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        width: "100%",
        marginTop: "4px",
      }}
    >
      {copied ? "✓ COPIED!" : "COPY ADDRESS"}
    </button>
  );
}

function TiltCard({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotY = ((x - cx) / cx) * 7;
      const rotX = -((y - cy) / cy) * 7;
      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.025)`;
      card.style.boxShadow = `0 0 48px ${accent}55, 0 0 100px ${accent}18, inset 0 1px 0 ${accent}44`;
    },
    [accent]
  );

  const onMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform =
      "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    card.style.boxShadow = `0 0 24px ${accent}28, inset 0 1px 0 ${accent}33`;
  }, [accent]);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        flex: 1,
        minWidth: "280px",
        maxWidth: "420px",
        background: "rgba(2,0,8,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "16px",
        border: `1px solid ${accent}44`,
        boxShadow: `0 0 24px ${accent}28, inset 0 1px 0 ${accent}33`,
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        cursor: "default",
      }}
    >
      {children}
    </div>
  );
}

export default function DonatePage() {
  const [, navigate] = useLocation();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020008",
        color: "#e0e0f0",
        fontFamily: "'Share Tech Mono', monospace",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Aurora beams */}
      <div className="aurora-beam aurora-beam-1" />
      <div className="aurora-beam aurora-beam-2" />
      <div className="aurora-beam aurora-beam-3" />

      {/* Star field */}
      <div className="star-field" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <div style={{ position: "relative", zIndex: 10, padding: "20px 24px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "'Orbitron', monospace",
            fontWeight: 700,
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            color: "#7c5fff",
            background: "rgba(124,95,255,0.08)",
            border: "1px solid rgba(124,95,255,0.35)",
            borderRadius: "999px",
            padding: "10px 20px",
            backdropFilter: "blur(12px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(124,95,255,0.18)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 18px rgba(124,95,255,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(124,95,255,0.08)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          ← BACK TO DASHBOARD
        </button>
      </div>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "960px",
          margin: "0 auto",
          padding: "20px 24px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 900,
              fontSize: "clamp(1.6rem, 5vw, 2.8rem)",
              background: "linear-gradient(90deg, #7c5fff 0%, #00f5d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.06em",
              lineHeight: 1.1,
              marginBottom: "14px",
            }}
          >
            SUPPORT THE PROJECT
          </div>
          <p
            style={{
              color: "rgba(224,224,240,0.6)",
              fontSize: "0.88rem",
              lineHeight: 1.7,
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Buy me a coffee with crypto — every contribution keeps the dashboard
            alive.
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {/* EVM Card */}
          <TiltCard accent="#7c5fff">
            {/* Chain icons row */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "center",
                marginBottom: "4px",
              }}
            >
              {EVM_CHAINS.map(({ symbol, color }) => (
                <span
                  key={symbol}
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: 700,
                    fontSize: "0.42rem",
                    letterSpacing: "0.05em",
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}44`,
                    borderRadius: "6px",
                    padding: "4px 8px",
                  }}
                >
                  {symbol}
                </span>
              ))}
            </div>

            {/* Label */}
            <div
              style={{
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700,
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                color: "#7c5fff",
                textShadow: "0 0 12px rgba(124,95,255,0.6)",
              }}
            >
              EVM COMPATIBLE CHAINS
            </div>

            {/* QR */}
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "10px",
                border: "2px solid rgba(124,95,255,0.5)",
                boxShadow: "0 0 20px rgba(124,95,255,0.3)",
                marginTop: "4px",
              }}
            >
              <img
                src={`${BASE}qr-evm.png`}
                alt="EVM QR Code"
                style={{
                  width: "160px",
                  height: "160px",
                  display: "block",
                }}
              />
            </div>

            <ClickToCopyAddress address={EVM_ADDRESS} accent="#7c5fff" />
            <CopyButton address={EVM_ADDRESS} accent="#7c5fff" />
          </TiltCard>

          {/* Solana Card */}
          <TiltCard accent="#00f5d4">
            {/* Solana logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 397.7 311.7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="sol-g1"
                    x1="360.879"
                    y1="351.455"
                    x2="141.213"
                    y2="-69.974"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                  </linearGradient>
                  <linearGradient
                    id="sol-g2"
                    x1="264.829"
                    y1="401.601"
                    x2="45.163"
                    y2="-19.828"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                  </linearGradient>
                  <linearGradient
                    id="sol-g3"
                    x1="312.548"
                    y1="376.688"
                    x2="92.882"
                    y2="-44.741"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                  </linearGradient>
                </defs>
                <path
                  d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
                  fill="url(#sol-g1)"
                />
                <path
                  d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
                  fill="url(#sol-g2)"
                />
                <path
                  d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
                  fill="url(#sol-g3)"
                />
              </svg>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  color: "#00f5d4",
                  textShadow: "0 0 12px rgba(0,245,212,0.6)",
                }}
              >
                SOLANA CHAIN
              </span>
            </div>

            {/* QR */}
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "10px",
                border: "2px solid rgba(0,245,212,0.5)",
                boxShadow: "0 0 20px rgba(0,245,212,0.3)",
                marginTop: "4px",
              }}
            >
              <img
                src={`${BASE}qr-sol.png`}
                alt="Solana QR Code"
                style={{
                  width: "160px",
                  height: "160px",
                  display: "block",
                }}
              />
            </div>

            <ClickToCopyAddress address={SOL_ADDRESS} accent="#00f5d4" />
            <CopyButton address={SOL_ADDRESS} accent="#00f5d4" />
          </TiltCard>
        </div>

        {/* Note */}
        <p
          style={{
            fontSize: "0.72rem",
            color: "rgba(224,224,240,0.38)",
            textAlign: "center",
            lineHeight: 1.8,
            maxWidth: "500px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "24px",
            width: "100%",
          }}
        >
          Scan QR or copy address. Send any amount on the correct chain.
          <br />
          Thank you for supporting open-source crypto tools.
        </p>
      </div>
    </div>
  );
}
