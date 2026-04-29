import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy-load the heavy Spline runtime — only downloaded when needed
const Spline = lazy(() => import('@splinetool/react-spline'));

const SCENE_URL = 'https://prod.spline.design/3eUQPE5R4kmVgqPs/scene.splinecode';

/**
 * Performance-optimised Spline robot widget.
 *
 * Optimisations applied:
 *  1. React.lazy  – Spline runtime is code-split; not in the main bundle.
 *  2. IntersectionObserver – scene is not even requested until the container
 *     enters the viewport (avoids loading on mobile when user never scrolls).
 *  3. onLoad callback – skeleton is hidden only after the WebGL canvas is
 *     ready, preventing a jarring white flash.
 *  4. pointer-events: none on the canvas wrapper – the 3-D scene never
 *     accidentally swallows clicks meant for the page.
 *  5. will-change: transform on the outer shell lets the GPU composite the
 *     layer independently.
 */
export default function SplineRobot({ width = 520, height = 520 }) {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // ── 1. Trigger load only when in viewport ────────────────
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
      { rootMargin: '200px' } // start fetching 200 px before it's visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: 'relative',
        willChange: 'transform', // GPU compositing layer
        borderRadius: '32px',
        overflow: 'hidden',
      }}
    >
      {/* ── Skeleton / loading pulse ─────────────────────── */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '32px',
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(37,99,235,0.18) 0%, rgba(5,11,24,0.5) 70%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              zIndex: 2,
            }}
          >
            {/* Spinning ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: '3px solid rgba(37,99,235,0.2)',
                borderTop: '3px solid #2563EB',
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'rgba(160,180,220,0.55)', fontWeight: 500 }}>
              Loading 3D scene…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error fallback ───────────────────────────────── */}
      {hasError && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(37,99,235,0.06)',
          border: '1px dashed rgba(37,99,235,0.25)',
          color: 'rgba(160,180,220,0.5)', fontSize: '0.85rem', flexDirection: 'column', gap: '8px',
        }}>
          <span style={{ fontSize: '2rem' }}>🤖</span>
          Robot unavailable
        </div>
      )}

      {/* ── Spline canvas ────────────────────────────────── */}
      {shouldLoad && !hasError && (
        <Suspense fallback={null}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none', // ← never hijacks page clicks
              zIndex: 1,
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
    </div>
  );
}
