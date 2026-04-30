import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  const HERO_IMAGE = '/images/black-hole.png';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      overflow: 'hidden',
      background: '#010409',
    }}>
      {/* Stars Starfield */}
      {[...Array(100)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: Math.random() * 0.5 + 0.2,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            y: [0, Math.random() * 30 - 15, 0],
            x: [0, Math.random() * 30 - 15, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 3,
            height: Math.random() * 3,
            borderRadius: '50%',
            background: i % 10 === 0 ? '#60A5FA' : '#fff',
            boxShadow: '0 0 4px rgba(255,255,255,0.8)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Rotating Black Hole Background */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '120vw',
          height: '120vw',
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.55,
          filter: 'brightness(0.8) contrast(1.1) blur(2px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Center Glow Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(1,4,9,0.7) 100%)',
        zIndex: 1,
      }} />
    </div>
  );
}
