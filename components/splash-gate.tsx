"use client";

import { ReactNode, useEffect, useState } from "react";

export default function SplashGate({ children }: { children: ReactNode }) {
  const [revealing, setRevealing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      setProgress(Math.min(100, Math.floor(((Date.now() - startedAt) / 7000) * 100)));
    }, 50);
    const revealTimer = window.setTimeout(() => {
      setProgress(100);
      setRevealing(true);
    }, 7000);
    const removeSplashTimer = window.setTimeout(() => setComplete(true), 7700);
    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(removeSplashTimer);
    };
  }, []);

  return (
    <>
      <div className={`app-reveal ${revealing ? "app-reveal-visible" : ""}`} aria-hidden={!revealing}>
        {children}
      </div>
      {!complete && (
        <div className={`splash-screen ${revealing ? "splash-screen-fading" : ""}`} role="status" aria-label="Loading Represent Your City">
          <div className="splash-art-wrap">
            {!imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="splash-art"
                src="/image-2.png"
                alt="Global War: Represent your city. Conquer the world."
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="splash-fallback">
                <span className="splash-fallback-mark">RYC</span>
                <span className="splash-fallback-title">Global War</span>
                <span className="splash-fallback-caption">Represent your city. Shape what happens next.</span>
              </div>
            )}
          </div>
          <div className="splash-progress-wrap" aria-live="off">
            <div className="splash-progress-copy"><span>Preparing the assembly</span><span>{progress}%</span></div>
            <div className="splash-progress-track"><div className="splash-progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      )}
    </>
  );
}