import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      overflow: 'hidden',
      background: 'radial-gradient(ellipse at 60% 20%, rgba(37,99,235,0.22) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(129,140,248,0.15) 0%, transparent 50%), #050B18',
    }}>
      {/* Animated grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
      }} />

      {/* Floating orb 1 */}
      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '10%', left: '55%',
          width: 520, height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating orb 2 */}
      <motion.div
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          position: 'absolute',
          top: '40%', left: '5%',
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating orb 3 */}
      <motion.div
        animate={{ x: [0, 30, -40, 0], y: [0, -20, 30, 0], scale: [1, 1.2, 0.85, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{
          position: 'absolute',
          bottom: '15%', right: '10%',
          width: 350, height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.18) 0%, transparent 70%)',
          filter: 'blur(65px)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: `${8 + i * 7.5}%`,
            top: `${20 + (i % 5) * 12}%`,
            width: i % 3 === 0 ? 6 : 4,
            height: i % 3 === 0 ? 6 : 4,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#2563EB' : '#60A5FA',
            boxShadow: `0 0 ${i % 3 === 0 ? 12 : 8}px ${i % 2 === 0 ? 'rgba(37,99,235,0.8)' : 'rgba(96,165,250,0.8)'}`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Bottom gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, transparent 40%, rgba(5,11,24,0.85) 100%)',
        zIndex: 1,
      }} />
    </div>
  );
}
