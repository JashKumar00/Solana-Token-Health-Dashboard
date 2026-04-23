import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  direction?: "bottom" | "top";
  splitBy?: "words" | "letters";
}

export function BlurText({
  text,
  className = "",
  delay = 100,
  direction = "bottom",
  splitBy = "words",
}: BlurTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tokens = splitBy === "words" ? text.split(" ") : text.split("");

  const from = direction === "bottom"
    ? { filter: "blur(10px)", opacity: 0, y: 40 }
    : { filter: "blur(10px)", opacity: 0, y: -40 };
  const to = { filter: "blur(0px)", opacity: 1, y: 0 };

  return (
    <span ref={ref} className={className} style={{ display: "inline" }}>
      {tokens.map((token, i) => (
        <motion.span
          key={i}
          initial={from}
          animate={inView ? to : from}
          transition={{ duration: 0.5, delay: (i * delay) / 1000, ease: "easeOut" }}
          style={{ display: "inline-block", whiteSpace: splitBy === "words" ? "pre" : "normal" }}
        >
          {token}{splitBy === "words" && i < tokens.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}
