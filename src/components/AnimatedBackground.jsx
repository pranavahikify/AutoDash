import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function AnimatedBackground() {
  const HERO_IMAGE = '/images/black-hole.png';
  const [stars, setStars] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Reduce star count significantly for mobile to prevent "hanging"
    const count = window.innerWidth < 768 ? 40 : 100;
    const newStars = Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }));
    setStars(newStars);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0,
      background: '#010409',
      pointerEvents: 'none',
    }}>
      {/* Optimized Starfield (Using CSS for better performance) */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star-element"
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            backgroundColor: '#fff',
            borderRadius: '50%',
            opacity: 0.5,
            animation: `twinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
            willChange: 'opacity',
          }}
        />
      ))}

      {/* Rotating Black Hole Background */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: isMobile ? '250vw' : '160vw',
          height: isMobile ? '250vw' : '160vw',
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.45,
          filter: isMobile ? 'brightness(0.7) contrast(1.1)' : 'brightness(0.7) contrast(1.1) blur(1px)',
          zIndex: 0,
          pointerEvents: 'none',
          transformOrigin: 'center center',
          x: '-50%',
          y: '-50%',
          willChange: 'transform',
        }}
      />

      {/* Center Glow Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(1,4,9,0.7) 100%)',
        zIndex: 1,
      }} />

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .star-element {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
