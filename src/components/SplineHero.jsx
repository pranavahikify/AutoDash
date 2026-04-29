import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy-load the heavy Spline runtime — keeps it out of the main bundle
const Spline = lazy(() => import('@splinetool/react-spline'));

const SCENE_URL = 'https://prod.spline.design/3eUQPE5R4kmVgqPs/scene.splinecode';

/**
 * Performance-optimised Spline hero scene.
 * Optimisations:
 *  1. React.lazy  – code-split, not in main bundle
 *  2. IntersectionObserver – only fetches when element enters viewport
 *  3. pointer-events: none – canvas never steals page clicks
 *  4. will-change: transform – separate GPU compositing layer
 *  5. Graceful skeleton → fade-in on load
 */
export default function SplineHero({ style = {} }) {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Only fetch the scene when container is near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        willChange: 'transform',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Loading skeleton pulse */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            style={{
              position: 'absolute', inset: 0, zIndex: 2,
              background: 'radial-gradient(ellipse at 50% 40%, rgba(37,99,235,0.16) 0%, transparent 65%), #050B18',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '16px',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid rgba(37,99,235,0.2)',
                borderTop: '3px solid #2563EB',
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'rgba(160,180,220,0.45)', fontWeight: 500 }}>
              Loading 3D scene…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spline canvas */}
      {shouldLoad && !hasError && (
        <Suspense fallback={null}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 1 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              pointerEvents: 'none', // never blocks page interaction
            }}
          >
            <Spline
              scene={SCENE_URL}
              onLoad={() => setIsLoaded(true)}
              onError={() => { setHasError(true); setIsLoaded(true); }}
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>
        </Suspense>
      )}

      {/* Gradient overlay so text stays readable */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(5,11,24,0.35) 0%, rgba(5,11,24,0.15) 40%, rgba(5,11,24,0.75) 100%)',
      }} />

      {/* Subtle vignette edges */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(5,11,24,0.55) 100%)',
      }} />
    </div>
  );
}
