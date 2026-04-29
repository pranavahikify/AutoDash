import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';

const Spline = lazy(() => import('@splinetool/react-spline'));

export default function SplineBackground({ opacity = 0.9 }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      overflow: 'hidden',
    }}>
      {/* Spline 3D scene */}
      <Suspense fallback={
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 60% 30%, rgba(37,99,235,0.25) 0%, rgba(5,11,24,0) 60%)',
        }} />
      }>
        <div style={{ opacity, position: 'absolute', inset: 0 }}>
          <Spline scene="https://prod.spline.design/F5SdcoM29RQR6yy3/scene.splinecode" />
        </div>
      </Suspense>

      {/* Gradient overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(5,11,24,0.45) 0%, rgba(5,11,24,0.25) 50%, rgba(5,11,24,0.85) 100%)',
        zIndex: 1,
      }} />

      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,11,24,0.6) 100%)',
        zIndex: 2,
      }} />
    </div>
  );
}
