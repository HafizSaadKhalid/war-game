"use client";

import { ReactNode, useEffect, useState } from "react";

export default function SplashGate({ children }: { children: ReactNode }) {
  const [revealing, setRevealing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const revealTimer = window.setTimeout(() => setRevealing(true), 3000);
    const removeSplashTimer = window.setTimeout(() => setComplete(true), 3700);
    return () => {
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
          <span className="splash-loading-label">Preparing the assembly</span>
        </div>
      )}
    </>
  );
}