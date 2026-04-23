import { useEffect, useRef } from "react";

interface HlsVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}

export function HlsVideo({ src, className = "", style }: HlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
      return;
    }

    let hls: any;
    import("hls.js").then((mod) => {
      const Hls = mod.default;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      }
    });

    return () => { if (hls) hls.destroy(); };
  }, [src]);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      autoPlay
      className={className}
      style={style}
    />
  );
}
