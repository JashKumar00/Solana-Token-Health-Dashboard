import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ArrowUpRight, Activity, Zap, BarChart3, Search, Shield, TrendingUp, Wallet, AlertTriangle, Eye, CheckCircle, ChevronRight } from "lucide-react";

/* ─── constants ─── */
const DASHBOARD_URL = "/app";

const TICKERS = [
  { sym: "SOL",    price: "$148.23",    change: "+2.1%",  up: true,  mint: "So11111111111111111111111111111111111111112" },
  { sym: "JUP",    price: "$0.82",      change: "-0.8%",  up: false, mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { sym: "BONK",   price: "$0.0000231", change: "+5.4%",  up: true,  mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { sym: "WIF",    price: "$1.87",      change: "+3.2%",  up: true,  mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { sym: "POPCAT", price: "$0.41",      change: "+8.7%",  up: true,  mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr" },
  { sym: "TRUMP",  price: "$8.23",      change: "-2.3%",  up: false, mint: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN" },
  { sym: "PEPE",   price: "$0.0000112", change: "+12.1%", up: true,  mint: "" },
  { sym: "RAY",    price: "$2.41",      change: "-1.1%",  up: false, mint: "" },
  { sym: "ORCA",   price: "$3.12",      change: "+0.5%",  up: true,  mint: "" },
  { sym: "PYTH",   price: "$0.31",      change: "+1.4%",  up: true,  mint: "" },
  { sym: "DOGE",   price: "$0.142",     change: "+6.3%",  up: true,  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" },
  { sym: "SHIB",   price: "$0.0000214", change: "+3.8%",  up: true,  mint: "" },
];

const COIN_COLORS: Record<string, string> = {
  SOL: "#9945FF", JUP: "#00bcd4", BONK: "#FF9800", WIF: "#E91E63",
  POPCAT: "#4CAF50", TRUMP: "#f44336", PEPE: "#8BC34A", DOGE: "#FFC107",
};
const COIN_EMOJIS: Record<string, string> = {
  SOL: "◎", JUP: "⚡", BONK: "🔥", WIF: "🐶", POPCAT: "🐱",
  TRUMP: "🦁", PEPE: "🐸", DOGE: "🚀",
};

const JUP_CDN = "https://img.jup.ag/tokens";

const COIN_LOCAL_LOGO: Record<string, string> = {
  BONK:   "/coins/BONK.webp",
  WIF:    "/coins/WIF.webp",
  SOL:    "/coins/SOL.webp",
  POPCAT: "/coins/POPCAT.webp",
  JUP:    "/coins/JUP.webp",
  TRUMP:  "/coins/TRUMP.webp",
  DOGE:   "/coins/DOGE.png",
  PEPE:   "/coins/PEPE.png",
};

/* ─── helpers ─── */
function openApp(e: React.MouseEvent) {
  e.preventDefault();
  window.location.href = DASHBOARD_URL;
}

/* ─── ParticleCanvas ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -Math.random() * 0.5 - 0.1,
      alpha: Math.random() * 0.6 + 0.1,
      color: ["#ff2d8a", "#9b45ff", "#00e5ff", "#00ff88"][Math.floor(Math.random() * 4)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        if (p.x < -5 || p.x > W + 5) p.dx *= -1;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

/* ─── FloatingCoin ─── */
function FloatingCoin({ sym, size = 64, delay = 0, rotate = 0, mint = "", isHovered = false, anyHovered = false, onHoverStart, onHoverEnd }: {
  sym: string; size?: number; delay?: number; rotate?: number; mint?: string;
  isHovered?: boolean; anyHovered?: boolean;
  onHoverStart?: () => void; onHoverEnd?: () => void;
}) {
  const color = COIN_COLORS[sym] ?? "#9b45ff";
  const emoji = COIN_EMOJIS[sym] ?? sym[0];
  const localLogo = COIN_LOCAL_LOGO[sym] ?? "";
  const cdnLogo = mint ? `${JUP_CDN}/${mint}` : "";
  const [imgSrc, setImgSrc] = useState(localLogo || cdnLogo);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImgError = () => {
    if (imgSrc === localLogo && cdnLogo) {
      setImgSrc(cdnLogo);
    } else {
      setImgFailed(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        y: [0, -18, 0],
        rotateZ: [rotate, rotate + 8, rotate - 4, rotate],
      }}
      transition={{
        opacity: { delay, duration: 0.5 },
        y: { delay, duration: 3.5 + delay * 0.4, repeat: Infinity, ease: "easeInOut" },
        rotateZ: { delay, duration: 5 + delay * 0.3, repeat: Infinity, ease: "easeInOut" },
      }}
      whileHover={{ scale: 1.2, rotateY: 15 }}
      style={{ width: size, height: size, borderRadius: "50%", position: "relative", cursor: "pointer" }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
    >
      {/* Outer pulse glow when this coin is hovered */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0.6, 0.2, 0.6], scale: [1, 1.5, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -size * 0.3,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}70 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Subtle ambient glow on other coins when one is hovered */}
      {!isHovered && anyHovered && (
        <div style={{
          position: "absolute", inset: -6, borderRadius: "50%",
          background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      {/* Spinning glow ring */}
      <div style={{
        position: "absolute", inset: -4, borderRadius: "50%",
        background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`,
        animation: "spin 3s linear infinite",
        opacity: isHovered ? 1 : anyHovered ? 0.3 : 0.6,
        filter: isHovered ? `drop-shadow(0 0 8px ${color})` : "none",
        transition: "opacity 0.3s ease, filter 0.3s ease",
      }} />

      {/* Coin body */}
      <div style={{
        width: "100%", height: "100%", borderRadius: "50%",
        background: isHovered
          ? `radial-gradient(circle at 35% 35%, ${color}60, #080010 80%)`
          : `radial-gradient(circle at 35% 35%, ${color}30, #080010 80%)`,
        border: `2px solid ${isHovered ? color : color + "60"}`,
        boxShadow: isHovered
          ? `0 0 30px ${color}90, 0 0 60px ${color}40, inset 0 0 20px ${color}30`
          : `0 0 12px ${color}40, inset 0 0 10px ${color}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        position: "relative", zIndex: 1,
        backdropFilter: "blur(4px)",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease",
      }}>
        {imgSrc && !imgFailed ? (
          <img
            src={imgSrc}
            alt={sym}
            style={{ width: "85%", height: "85%", objectFit: "cover", borderRadius: "50%" }}
            onError={handleImgError}
          />
        ) : (
          <span style={{ fontSize: size * 0.38, lineHeight: 1 }}>{emoji}</span>
        )}
      </div>

      {/* Label */}
      <div style={{
        position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)",
        fontSize: 9, fontFamily: "Barlow, sans-serif", fontWeight: 700,
        color: isHovered ? color : "rgba(255,255,255,0.45)",
        letterSpacing: "0.08em", whiteSpace: "nowrap",
        textShadow: isHovered ? `0 0 8px ${color}` : "none",
        transition: "color 0.3s ease, text-shadow 0.3s ease",
      }}>
        {sym}
      </div>
    </motion.div>
  );
}

/* ─── Ticker ─── */
function Ticker() {
  const items = [...TICKERS, ...TICKERS];
  return (
    <div style={{
      overflow: "hidden",
      borderBottom: "1px solid rgba(155,69,255,0.2)",
      borderTop: "1px solid rgba(155,69,255,0.15)",
      background: "rgba(8,0,16,0.9)", backdropFilter: "blur(8px)",
      padding: "10px 0",
    }}>
      <div className="ticker-track">
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 20px", minWidth: "max-content" }}>
            {COIN_LOCAL_LOGO[t.sym] ? (
              <img
                src={COIN_LOCAL_LOGO[t.sym]}
                alt={t.sym}
                style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  if (t.mint) { el.src = `${JUP_CDN}/${t.mint}`; }
                  else { el.style.display = "none"; }
                }}
              />
            ) : (
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: COIN_COLORS[t.sym] ?? "#9b45ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "white", fontWeight: 700 }}>
                {t.sym[0]}
              </span>
            )}
            <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{t.sym}</span>
            <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.price}</span>
            <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 600, fontSize: 12, color: t.up ? "#00ff88" : "#ff5050" }}>
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  return (
    <nav style={{
      position: "fixed", top: 16, left: 0, right: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <motion.div
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "conic-gradient(from 0deg, #ff2d8a, #9b45ff, #00e5ff, #00ff88, #ff2d8a)",
            padding: 2, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#080010" }}>
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Token Health"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </motion.div>
        <span style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: 20, color: "white", letterSpacing: "-0.02em" }}>
          Token Health
        </span>
      </div>

      {/* Nav links */}
      <div className="liquid-glass nav-pill" style={{ borderRadius: 9999, padding: "4px 6px", display: "flex", alignItems: "center", gap: 2 }}>
        <div className="nav-links-group" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { label: "Features", href: "#features" },
            { label: "How It Works", href: "#how-it-works" },
            { label: "Data Sources", href: "#data-sources" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              style={{ padding: "8px 14px", fontSize: 14, fontFamily: "Barlow, sans-serif", fontWeight: 500, color: "rgba(255,255,255,0.75)", textDecoration: "none", borderRadius: 9999, transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href={DASHBOARD_URL}
          onClick={openApp}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #ff2d8a, #9b45ff)",
            color: "white", borderRadius: 9999,
            padding: "8px 16px", fontSize: 14,
            fontFamily: "Barlow, sans-serif", fontWeight: 600,
            textDecoration: "none", transition: "opacity 0.2s",
            boxShadow: "0 0 20px rgba(255,45,138,0.4)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Open App <ArrowUpRight size={13} />
        </a>
      </div>
    </nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [8, -8]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-8, 8]), { stiffness: 100, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const [hoveredCoin, setHoveredCoin] = useState<string | null>(null);

  const coins = [
    { sym: "BONK",   size: 72, delay: 0.1,  x: -380, y: -40,  rotate: -15, mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
    { sym: "WIF",    size: 64, delay: 0.2,  x: -280, y: 80,   rotate: 10,  mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
    { sym: "SOL",    size: 56, delay: 0.3,  x: -320, y: -120, rotate: 5,   mint: "So11111111111111111111111111111111111111112" },
    { sym: "POPCAT", size: 60, delay: 0.15, x: 340,  y: -50,  rotate: 12,  mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr" },
    { sym: "JUP",    size: 56, delay: 0.25, x: 280,  y: 90,   rotate: -8,  mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
    { sym: "TRUMP",  size: 50, delay: 0.35, x: 360,  y: -130, rotate: 18,  mint: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN" },
    { sym: "DOGE",   size: 44, delay: 0.4,  x: -200, y: 160,  rotate: -20, mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" },
    { sym: "PEPE",   size: 44, delay: 0.45, x: 210,  y: 155,  rotate: 15,  mint: "F2Tc5F7e5AFnGHKUTtBCCpYH3WTBkhVXg31m7LCkSAZT" },
  ];

  return (
    <section
      className="hero-section"
      onMouseMove={handleMouse}
      style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "120px 24px 80px" }}
    >
      <ParticleCanvas />

      {/* Bg gradient blobs */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "20%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,138,0.12) 0%, transparent 70%)", filter: "blur(40px)", animation: "pulse1 4s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", top: "30%", right: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,69,255,0.14) 0%, transparent 70%)", filter: "blur(40px)", animation: "pulse2 5s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "40%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* Floating coins (absolute positioned around center) */}
      <div className="floating-coins-wrap" style={{ position: "absolute", top: "50%", left: "50%", zIndex: 5 }}>
        {coins.map((c) => (
          <div key={c.sym} style={{ position: "absolute", transform: `translate(${c.x}px, ${c.y}px)` }}>
            <FloatingCoin
              sym={c.sym}
              size={c.size}
              delay={c.delay}
              rotate={c.rotate}
              mint={c.mint}
              isHovered={hoveredCoin === c.sym}
              anyHovered={hoveredCoin !== null}
              onHoverStart={() => setHoveredCoin(c.sym)}
              onHoverEnd={() => setHoveredCoin(null)}
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "min(1200px, 92vw)", rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}
        >
          <div className="liquid-glass" style={{ borderRadius: 9999, padding: "4px 4px 4px 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: "linear-gradient(135deg,#ff2d8a,#9b45ff)", color: "white", borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontFamily: "Barlow, sans-serif", fontWeight: 700 }}>🚀 NEW</span>
            <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", paddingRight: 12 }}>Real-time health scores for every Solana token</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: "clamp(60px, 14vw, 220px)", color: "white", lineHeight: 0.88, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            Solana
          </h1>
          <h1 style={{
            fontFamily: "Instrument Serif, serif", fontStyle: "italic",
            fontSize: "clamp(60px, 14vw, 220px)", lineHeight: 0.88, margin: "0 0 20px", letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #ff2d8a 0%, #9b45ff 40%, #00e5ff 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Memecoins.
          </h1>
          <p style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: "clamp(22px, 4.5vw, 68px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.1, margin: "0 0 28px" }}>
            Know what's real. Trade smarter.
          </p>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ fontFamily: "Barlow, sans-serif", fontWeight: 300, fontSize: "clamp(15px, 1.6vw, 22px)", color: "rgba(255,255,255,0.5)", maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.6 }}
        >
          The memecoin market is full of fake volume, wash trading & hidden rug pulls.
          Token Health gives you a real-time Organic Score and deep intelligence for every Solana token.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
        >
          <motion.a
            href={DASHBOARD_URL}
            onClick={openApp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #ff2d8a 0%, #9b45ff 60%, #00e5ff 100%)",
              color: "white", borderRadius: 9999, padding: "14px 28px",
              fontSize: 16, fontFamily: "Barlow, sans-serif", fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 0 40px rgba(255,45,138,0.5), 0 0 80px rgba(155,69,255,0.3)",
            }}
          >
            Open the Dashboard <ArrowUpRight size={16} />
          </motion.a>
          <a
            href="#how-it-works"
            style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Barlow, sans-serif", fontWeight: 500, fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
          >
            See how it works <ChevronRight size={14} />
          </a>
        </motion.div>

        {/* Powered by pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          style={{ marginTop: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}
        >
          <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Powered by</span>
          {["Jupiter API", "DexScreener", "GeckoTerminal"].map((s) => (
            <span key={s} className="liquid-glass" style={{ borderRadius: 9999, padding: "4px 12px", fontSize: 12, fontFamily: "Barlow, sans-serif", color: "rgba(255,255,255,0.55)" }}>{s}</span>
          ))}
        </motion.div>
      </motion.div>

      {/* Scrolling mock card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 720, marginTop: 60 }}
      >
        <HeroDashboardCard />
      </motion.div>
    </section>
  );
}

function HeroDashboardCard() {
  const bars = [35, 55, 42, 70, 60, 85, 67, 78, 45, 90, 72, 88, 65, 80, 50];
  return (
    <div className="liquid-glass" style={{ borderRadius: 20, padding: 20, background: "rgba(8,0,16,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,45,138,0.15)", boxShadow: "0 0 60px rgba(155,69,255,0.15)" }}>
      {/* Window bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <div className="liquid-glass" style={{ marginLeft: 8, flex: 1, height: 24, borderRadius: 9999, display: "flex", alignItems: "center", padding: "0 12px" }}>
          <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>token-health.app | BONK</span>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "Barlow, sans-serif", color: "#00ff88" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
          LIVE
        </span>
      </div>
      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { l: "Health Score", v: "87", unit: "/100", c: "#00e5ff" },
          { l: "Price", v: "$0.0000231", c: "white" },
          { l: "24h Volume", v: "$8.4M", c: "#00ff88" },
          { l: "Liquidity", v: "$2.1M", c: "#ff2d8a" },
        ].map((m) => (
          <div key={m.l} style={{ borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontFamily: "Barlow, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{m.l}</div>
            <div style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: 18, color: m.c }}>{m.v}</div>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(255,45,138,0.03)", border: "1px solid rgba(255,45,138,0.08)", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 3, transition: "height 0.3s", height: `${h}%`, background: i > 9 ? "rgba(0,229,255,0.8)" : i > 6 ? "rgba(155,69,255,0.6)" : "rgba(255,45,138,0.5)" }} />
          ))}
        </div>
      </div>
      {/* Tags */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {["🔥 Organic", "✅ Verified", "💎 Active Holders"].map((t) => (
          <span key={t} className="liquid-glass" style={{ borderRadius: 9999, padding: "4px 10px", fontSize: 11, fontFamily: "Barlow, sans-serif", color: "rgba(255,255,255,0.55)" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Problems ─── */
function Problems() {
  const items = [
    { icon: AlertTriangle, title: "Fake Volume & Wash Trading", body: "Bots inflate numbers to fake activity. Most dashboards show raw data — you can't tell what's real from what's manufactured.", color: "#ff5050" },
    { icon: Eye, title: "Hidden Rug Pull Signals", body: "Concentrated holdings, insider wallets, and locked LP traps are invisible until it's too late. Token Health surfaces them instantly.", color: "#ff9800" },
    { icon: BarChart3, title: "Information Overload", body: "Dozens of metrics, multiple DEXes, conflicting sources. Traders spend hours piecing together what should take 5 seconds.", color: "#9b45ff" },
    { icon: TrendingUp, title: "No Single Health Signal", body: "Is this token healthy? Nobody could answer that simply — until now. One score. The full picture.", color: "#00e5ff" },
  ];
  return (
    <section style={{ padding: "100px 32px", background: "#080010" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="liquid-glass" style={{ display: "inline-flex", borderRadius: 9999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>The Problem</span>
          </div>
          <h2 style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: "clamp(44px, 8vw, 120px)", color: "white", margin: 0, lineHeight: 0.9 }}>
            The market lies.<br />Most tools help it.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {items.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, rotateX: -2 }}
              style={{ borderRadius: 20, padding: 28, background: `linear-gradient(135deg, ${p.color}0a 0%, rgba(8,0,16,0) 100%)`, border: `1px solid ${p.color}20`, cursor: "default" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                <p.icon size={16} style={{ color: p.color }} />
              </div>
              <h3 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 600, fontSize: 15, color: "white", margin: "0 0 8px" }}>{p.title}</h3>
              <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HowItWorks ─── */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Search Any Token", body: "Name, symbol, or paste a Solana mint address. Data loads from Jupiter, DexScreener, and GeckoTerminal instantly.", color: "#ff2d8a" },
    { n: "02", title: "Get the Organic Score", body: "Every token gets a real-time Organic Score (0–100) — a composite of genuine vs. bot-driven volume, liquidity depth, and holder concentration.", color: "#9b45ff" },
    { n: "03", title: "Analyze the Intelligence", body: "Buy/sell pressure across 4 timeframes, DEX volume breakdown, top trading pairs, live 5s price chart, and raw on-chain data — all in one view.", color: "#00e5ff" },
    { n: "04", title: "Trade With Confidence", body: "Scan any wallet to see all holdings with health scores. Know what you're holding, not just how much.", color: "#00ff88" },
  ];
  return (
    <section id="how-it-works" style={{ padding: "100px 24px", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #080010 0%, #0d0020 50%, #080010 100%)" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(155,69,255,0.08) 0%, transparent 70%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="liquid-glass" style={{ display: "inline-flex", borderRadius: 9999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>How It Works</span>
          </div>
          <h2 style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: "clamp(44px, 8vw, 120px)", color: "white", margin: 0, lineHeight: 0.95 }}>
            Intelligence in seconds.<br /><span style={{ color: "rgba(255,255,255,0.4)" }}>Not hours.</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ scale: 1.03, rotateY: 3 }}
              className="liquid-glass"
              style={{ borderRadius: 20, padding: 28 }}
            >
              <div style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: 56, lineHeight: 1, color: `${s.color}30`, marginBottom: 12 }}>{s.n}</div>
              <div style={{ width: 32, height: 3, background: s.color, borderRadius: 99, marginBottom: 16, boxShadow: `0 0 10px ${s.color}` }} />
              <h3 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 600, fontSize: 15, color: "white", margin: "0 0 8px" }}>{s.title}</h3>
              <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>{s.body}</p>
            </motion.div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <motion.a
            href={DASHBOARD_URL}
            onClick={openApp}
            whileHover={{ scale: 1.05 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, className: "liquid-glass-strong",
              borderRadius: 9999, padding: "12px 28px",
              fontFamily: "Barlow, sans-serif", fontWeight: 600, fontSize: 15, color: "white", textDecoration: "none",
              border: "1px solid rgba(255,45,138,0.3)", background: "rgba(255,45,138,0.08)",
            }}
          >
            Try It Now <ArrowUpRight size={15} />
          </motion.a>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function Features() {
  const cards = [
    { icon: Zap,        title: "5-Second Refresh",        body: "Price data updates every 5 seconds with a live countdown bar — never stale data again.", color: "#00e5ff" },
    { icon: BarChart3,  title: "Multi-Timeframe Analysis", body: "5M, 1H, 6H, 24H pressure, tx counts, volume, and price changes in one unified intelligence grid.", color: "#9b45ff" },
    { icon: Search,     title: "DEX Breakdown",            body: "See every exchange trading a token — volume per DEX, top pairs by liquidity, and live DexScreener links.", color: "#ff2d8a" },
    { icon: Shield,     title: "Verified Tokens",          body: "Jupiter's official verification badge system. Spot unverified and potentially risky tokens at a glance.", color: "#00ff88" },
    { icon: Wallet,     title: "Wallet Portfolio Scan",    body: "Paste any Solana wallet and see all holdings ranked by USD value with health scores for every position.", color: "#ffd700" },
    { icon: TrendingUp, title: "Trading Intelligence",     body: "Average trade size, buy pressure %, 24h PnL estimates per DEX, and DEX volume breakdown charts.", color: "#ff9800" },
  ];
  return (
    <section id="features" style={{ padding: "100px 32px", background: "#080010" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="liquid-glass" style={{ display: "inline-flex", borderRadius: 9999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Features</span>
          </div>
          <h2 style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: "clamp(44px, 8vw, 120px)", color: "white", margin: 0, lineHeight: 0.95 }}>
            Every signal.<br />One dashboard.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {cards.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, rotateX: -2, rotateY: 2 }}
              style={{
                borderRadius: 20, padding: 28,
                background: `linear-gradient(135deg, ${f.color}08 0%, rgba(8,0,16,0.6) 100%)`,
                border: `1px solid ${f.color}18`,
                transition: "border-color 0.3s, box-shadow 0.3s",
                cursor: "default",
              }}
              onHoverStart={(e) => { (e.target as HTMLElement).style.borderColor = `${f.color}40`; (e.target as HTMLElement).style.boxShadow = `0 0 30px ${f.color}12`; }}
              onHoverEnd={(e) => { (e.target as HTMLElement).style.borderColor = `${f.color}18`; (e.target as HTMLElement).style.boxShadow = "none"; }}
            >
              <div className="liquid-glass-strong" style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <f.icon size={16} style={{ color: f.color }} />
              </div>
              <h3 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 600, fontSize: 15, color: "white", margin: "0 0 8px" }}>{f.title}</h3>
              <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── DataSources ─── */
function DataSources() {
  const sources = [
    { name: "Jupiter API", tag: "Primary",   color: "#00e5ff", items: ["Token search (ultra/v1/search)", "Organic Score & health metadata", "Token verification badges", "Wallet balances & holdings", "Live USD price feed"] },
    { name: "DexScreener", tag: "Market",    color: "#ff2d8a", items: ["Buy/sell pressure per timeframe", "24h volume breakdown", "Top trading pairs by liquidity", "Price change across 5M/1H/6H/24H", "DEX-level volume split"] },
    { name: "GeckoTerminal", tag: "Charts",  color: "#9b45ff", items: ["OHLCV candlestick data", "Historical price charts", "1m, 5m, 15m, 1h resolutions", "Trading pair identification", "Volume-weighted price data"] },
  ];
  return (
    <section id="data-sources" style={{ padding: "100px 32px", background: "linear-gradient(180deg, #080010 0%, #0d0020 50%, #080010 100%)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="liquid-glass" style={{ display: "inline-flex", borderRadius: 9999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Data Sources</span>
          </div>
          <h2 style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: "clamp(44px, 8vw, 120px)", color: "white", margin: 0, lineHeight: 0.95 }}>
            Three sources.<br />One truth.
          </h2>
          <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 300, fontSize: "clamp(14px, 1.3vw, 18px)", color: "rgba(255,255,255,0.4)", marginTop: 16 }}>
            We fuse the best Solana data APIs into a single, unified intelligence layer.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {sources.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="liquid-glass"
              style={{ borderRadius: 20, padding: 28, borderTop: `2px solid ${s.color}` }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 700, fontSize: 17, color: "white", margin: 0 }}>{s.name}</h3>
                <span style={{ background: `${s.color}15`, color: s.color, borderRadius: 9999, padding: "3px 10px", fontSize: 11, fontFamily: "Barlow, sans-serif", fontWeight: 600 }}>{s.tag}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {s.items.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle size={12} style={{ color: s.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
function Stats() {
  const stats = [
    { v: "5s",   l: "Data refresh",     c: "#00e5ff" },
    { v: "3+",   l: "APIs fused",       c: "#ff2d8a" },
    { v: "100%", l: "Free to use",      c: "#00ff88" },
    { v: "∞",    l: "Tokens supported", c: "#9b45ff" },
  ];
  return (
    <section style={{ padding: "80px 24px", background: "#080010" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="liquid-glass" style={{ borderRadius: 24, padding: "60px 48px", background: "linear-gradient(135deg, rgba(155,69,255,0.06) 0%, rgba(0,229,255,0.04) 100%)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center" }}>
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: "clamp(48px, 8vw, 110px)", color: s.c, marginBottom: 6, textShadow: `0 0 30px ${s.c}60` }}>{s.v}</div>
                <div style={{ fontFamily: "Barlow, sans-serif", fontWeight: 300, fontSize: "clamp(13px, 1.1vw, 16px)", color: "rgba(255,255,255,0.35)" }}>{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Footer ─── */
function CtaFooter() {
  return (
    <section style={{ padding: "100px 24px 60px", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #080010 0%, #0d0020 100%)" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", top: "20%", left: "30%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,138,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,69,255,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* Floating mini coins */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {["BONK","WIF","DOGE","PEPE","SOL"].map((sym, i) => (
          <motion.div
            key={sym}
            animate={{ y: [-20, 20, -20], x: [0, 10, -5, 0], rotate: [0, 15, -10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            style={{ position: "absolute", top: `${15 + i * 15}%`, left: `${5 + i * 18}%`, opacity: 0.15 }}
          >
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: COIN_COLORS[sym] ?? "#9b45ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              {COIN_EMOJIS[sym] ?? "🪙"}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: "clamp(56px, 12vw, 180px)", color: "white", lineHeight: 0.88, margin: "0 0 24px", letterSpacing: "-0.03em" }}>
            Your edge starts<br />
            <span style={{ background: "linear-gradient(135deg, #ff2d8a, #9b45ff, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>here.</span>
          </h2>
          <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 300, fontSize: "clamp(15px, 1.4vw, 20px)", color: "rgba(255,255,255,0.4)", margin: "0 0 40px", lineHeight: 1.6 }}>
            Real-time health scores. Live price charts. Wallet portfolio analysis.<br />Full token intelligence — completely free.
          </p>
          <motion.a
            href={DASHBOARD_URL}
            onClick={openApp}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #ff2d8a 0%, #9b45ff 50%, #00e5ff 100%)",
              color: "white", borderRadius: 9999, padding: "16px 36px",
              fontSize: 18, fontFamily: "Barlow, sans-serif", fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 0 60px rgba(255,45,138,0.5), 0 0 120px rgba(155,69,255,0.3)",
            }}
          >
            Open the Dashboard <ArrowUpRight size={18} />
          </motion.a>
        </motion.div>

        {/* Footer bar */}
        <div style={{ marginTop: 80, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 Token Health. Powered by Jupiter API.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["GitHub", "X / Twitter"].map((l) => (
              <a key={l} href="#" style={{ fontFamily: "Barlow, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Root ─── */
export default function LandingPage() {
  return (
    <div style={{ background: "#080010", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse1 { from { transform: scale(1) translate(0,0); } to { transform: scale(1.15) translate(20px,-30px); } }
        @keyframes pulse2 { from { transform: scale(1) translate(0,0); } to { transform: scale(1.1) translate(-15px,25px); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        html { scroll-behavior: smooth; }
        .ticker-track { display: flex; width: max-content; animation: ticker-scroll 40s linear infinite; }
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .liquid-glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.08); position: relative; overflow: hidden; }
        .liquid-glass::before { content:''; position:absolute; inset:0; border-radius:inherit; padding:1px; background:linear-gradient(180deg,rgba(255,255,255,0.3) 0%,rgba(255,255,255,0.05) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.15) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
        .liquid-glass-strong { background: rgba(255,255,255,0.06); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.1); position: relative; overflow: hidden; }
        .liquid-glass-strong::before { content:''; position:absolute; inset:0; border-radius:inherit; padding:1px; background:linear-gradient(180deg,rgba(255,255,255,0.4) 0%,rgba(255,255,255,0.1) 30%,rgba(255,255,255,0) 50%,rgba(255,255,255,0.2) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .floating-coins-wrap { opacity: 0.4; transform: scale(0.75); }
        }
        @media (max-width: 768px) {
          .floating-coins-wrap { display: none !important; }
          .nav-links-group { display: none !important; }
          .nav-pill { padding: 4px !important; }
          .hero-section { padding: 100px 20px 60px !important; }
        }
        @media (max-width: 480px) {
          .nav-pill { background: transparent !important; box-shadow: none !important; backdrop-filter: none !important; }
          .nav-pill::before { display: none !important; }
          .hero-section { padding: 90px 16px 50px !important; }
        }
      `}</style>
      <Navbar />
      <Ticker />
      <div style={{ paddingTop: 56 }}>
        <Hero />
        <Problems />
        <HowItWorks />
        <Features />
        <DataSources />
        <Stats />
        <CtaFooter />
      </div>
    </div>
  );
}
