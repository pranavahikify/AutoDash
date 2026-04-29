import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const quotes = [
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    role: "Former UK Prime Minister",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    role: "Author & Humorist",
  },
  {
    text: "Opportunities don't happen. You create them.",
    author: "Chris Grosser",
    role: "Entrepreneur",
  },
  {
    text: "Success usually comes to those who are too busy to be looking for it.",
    author: "Henry David Thoreau",
    role: "Philosopher & Author",
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    role: "American Writer",
  },
  {
    text: "Data is the new oil. It's valuable, but if unrefined it cannot really be used.",
    author: "Clive Humby",
    role: "Data Scientist",
  },
];

export default function QuotesSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % quotes.length);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (idx) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    startTimer();
  };

  const prev = () => goTo((current - 1 + quotes.length) % quotes.length);
  const next = () => goTo((current + 1) % quotes.length);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.92 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.92 }),
  };

  return (
    <section style={{ padding: '100px 24px', position: 'relative' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '60px' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#2563EB',
              boxShadow: '0 0 12px rgba(37,99,235,0.8)',
            }} />
            <span style={{ color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Inspiration
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Words That{' '}
            <span className="gradient-text">Drive Success</span>
          </h2>
        </motion.div>

        {/* Slider */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: '280px' }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: 'absolute', width: '100%',
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: '48px 56px',
                  textAlign: 'center',
                  background: 'rgba(37,99,235,0.06)',
                  border: '1px solid rgba(37,99,235,0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Quote mark */}
                <div style={{
                  position: 'absolute', top: '24px', left: '32px',
                  color: 'rgba(37,99,235,0.25)', fontSize: '80px', lineHeight: 1,
                  fontFamily: 'Georgia, serif',
                }}>
                  "
                </div>

                {/* Glow blob */}
                <div style={{
                  position: 'absolute', top: '-40px', right: '-40px',
                  width: '200px', height: '200px',
                  background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                  borderRadius: '50%',
                }} />

                <motion.p
                  style={{
                    fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
                    lineHeight: 1.75,
                    color: 'rgba(220,235,255,0.92)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    marginBottom: '32px',
                    position: 'relative', zIndex: 1,
                  }}
                >
                  "{quotes[current].text}"
                </motion.p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{
                    width: 40, height: 40,
                    background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: 700,
                  }}>
                    {quotes[current].author[0]}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>— {quotes[current].author}</div>
                    <div style={{ color: '#60A5FA', fontSize: '0.82rem' }}>{quotes[current].role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '28px' }}>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={prev}
            style={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={20} />
          </motion.button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {quotes.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => goTo(i)}
                animate={{ width: i === current ? 24 : 8, background: i === current ? '#2563EB' : 'rgba(255,255,255,0.25)' }}
                transition={{ duration: 0.3 }}
                style={{
                  height: 8, borderRadius: '4px',
                  border: 'none', cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={next}
            style={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
