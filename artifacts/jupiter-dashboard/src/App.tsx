import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DonatePage from "@/pages/donate";
import LandingPage from "@/pages/LandingPage";

const queryClient = new QueryClient();

function DonateFAB() {
  const [location, navigate] = useLocation();
  if (location === "/donate" || location === "/") return null;
  return (
    <button
      onClick={() => navigate("/donate")}
      aria-label="Donate"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "'Orbitron', monospace",
        fontWeight: 700,
        fontSize: "0.6rem",
        letterSpacing: "0.12em",
        padding: "12px 20px",
        borderRadius: "999px",
        border: "1.5px solid transparent",
        backgroundImage:
          "linear-gradient(#020008, #020008), linear-gradient(90deg, #7c5fff, #00f5d4)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        color: "#e0e0f0",
        cursor: "pointer",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "fab-pulse 2.8s ease-in-out infinite",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "scale(1.08)";
        el.style.boxShadow = "0 0 28px rgba(124,95,255,0.6), 0 0 56px rgba(0,245,212,0.3)";
        el.style.animationPlayState = "paused";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "scale(1)";
        el.style.boxShadow = "none";
        el.style.animationPlayState = "running";
      }}
    >
      <span style={{ fontSize: "1rem", lineHeight: 1 }}>💎</span>
      DONATE
    </button>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/app" component={Dashboard} />
      <Route path="/donate" component={DonatePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  document.documentElement.classList.add("dark");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
          <DonateFAB />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
