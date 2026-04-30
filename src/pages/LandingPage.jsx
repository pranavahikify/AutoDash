import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Zap, Filter, Upload, ArrowRight, ChevronDown,
  Globe, Shield, Cpu, TrendingUp, Star, CheckCircle
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import QuotesSlider from '../components/QuotesSlider';

/* ─── Feature Cards data ──────────────────────────────── */
const features = [
  {
    icon: <BarChart2 size={28} />,
    title: 'Auto Visualization',
    desc: 'Instantly generate Bar, Line, and Pie charts from any CSV. No config required.',
    color: '#2563EB',
    gradient: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.05))',
    border: 'rgba(37,99,235,0.3)',
  },
  {
    icon: <Cpu size={28} />,
    title: 'Smart Insights',
    desc: 'AI-powered analysis extracts averages, trends, min/max and key patterns automatically.',
    color: '#818CF8',
    gradient: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(129,140,248,0.05))',
    border: 'rgba(129,140,248,0.3)',
  },
  {
    icon: <Upload size={28} />,
    title: 'CSV Upload',
    desc: 'Drag & drop or click to upload. Supports large files with instant parsing.',
    color: '#34D399',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.05))',
    border: 'rgba(52,211,153,0.3)',
  },
  {
    icon: <Filter size={28} />,
    title: 'Real-time Filters',
    desc: 'Dynamic column filters update all charts simultaneously without re-upload.',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
    border: 'rgba(245,158,11,0.3)',
  },
];

const steps = [
  { num: '01', icon: <Upload size={24} />, title: 'Upload CSV', desc: 'Drag & drop your data file. We accept any standard CSV format.' },
  { num: '02', icon: <Cpu size={24} />, title: 'Analyze Data', desc: 'AutoDash instantly parses and computes insights from your data.' },
  { num: '03', icon: <BarChart2 size={24} />, title: 'Generate Dashboard', desc: 'Beautiful, interactive charts and metrics appear in seconds.' },
];

/* ─── Landing Page ────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div style={{ background: '#010409', color: '#F0F6FF', position: 'relative', overflowX: 'hidden' }}>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '0 20px',
        }}
      >
        <AnimatedBackground />

        {/* Centered layout */}
        <motion.div
          style={{
            opacity: heroOpacity,
            y: heroY,
            position: 'relative',
            zIndex: 5,
            width: '100%',
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '80px 0 60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {/* ── Text Content ── */}
          <div style={{ 
            maxWidth: '900px', 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            padding: '0 10px'
          }}>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              style={{ marginBottom: '24px' }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(37,99,235,0.15)',
                border: '1px solid rgba(37,99,235,0.35)',
                borderRadius: '100px',
                padding: '8px 18px',
                backdropFilter: 'blur(12px)',
              }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#60A5FA', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  #1 CSV Dashboard Generator
                </span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                marginBottom: '24px',
                color: '#fff',
              }}
            >
              Transform CSV Data into<br />
              <span style={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 50%, #1D4ED8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                padding: '0 4px',
              }}>Stunning Dashboards</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                color: 'rgba(200,220,255,0.85)',
                maxWidth: '700px',
                marginBottom: '44px',
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              AutoDash turns raw data into actionable insights instantly —
              visualize your world through a cosmic lens.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.7 }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '16px', 
                flexWrap: 'wrap',
                width: '100%' 
              }}
            >
              <Link to="/auth" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  className="btn-primary"
                  style={{
                    padding: '16px 36px', fontSize: '1.05rem',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 0 32px rgba(37,99,235,0.4)',
                  }}
                >
                  Get Started Free <ArrowRight size={18} />
                </motion.button>
              </Link>
              <a href="#features" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn-secondary"
                  style={{ padding: '15px 30px', fontSize: '1rem' }}
                >
                  See Features
                </motion.button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.7 }}
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 'clamp(24px, 6vw, 64px)', 
                marginTop: '60px', 
                flexWrap: 'wrap',
                width: '100%'
              }}
            >
              {[['10K+', 'Users'], ['50M+', 'Rows Parsed'], ['4.9★', 'Rating']].map(([val, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: '#60A5FA' }}>{val}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(160,180,220,0.6)', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, cursor: 'pointer' }}
        >
          <ChevronDown size={28} color="rgba(255,255,255,0.3)" />
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" style={{ padding: '120px 24px', position: 'relative' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionHeader
            tag="Features"
            title={<>Everything you need to<br /><span className="gradient-text">visualize your data</span></>}
            sub="AutoDash analyzes any CSV and produces production-ready dashboards in seconds."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '64px' }}>
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="glass-card glow-border"
                style={{ padding: '32px', background: feat.gradient, border: `1px solid ${feat.border}` }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '16px',
                  background: `${feat.color}20`, border: `1px solid ${feat.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: feat.color, marginBottom: '20px',
                }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '10px' }}>{feat.title}</h3>
                <p style={{ color: 'rgba(160,180,220,0.75)', lineHeight: 1.65, fontSize: '0.92rem' }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how" style={{ padding: '100px 24px', background: 'rgba(37,99,235,0.04)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionHeader
            tag="How It Works"
            title={<>Three steps to your<br /><span className="gradient-text">perfect dashboard</span></>}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '64px' }}>
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '24px',
                  marginBottom: i < steps.length - 1 ? '0' : '0',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '20px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                  }}>
                    {step.icon}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 2, height: 60, background: 'linear-gradient(to bottom, rgba(37,99,235,0.5), transparent)', margin: '8px 0' }} />
                  )}
                </div>
                <div style={{ paddingTop: '12px', paddingBottom: i < steps.length - 1 ? '36px' : '0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60A5FA', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    STEP {step.num}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{step.title}</h3>
                  <p style={{ color: 'rgba(160,180,220,0.75)', lineHeight: 1.65, fontSize: '0.95rem' }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTES ───────────────────────────────────────── */}
      <QuotesSlider />


      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card"
            style={{
              padding: '64px 48px',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(129,140,248,0.08))',
              border: '1px solid rgba(37,99,235,0.25)',
            }}
          >
            <Zap size={48} color="#60A5FA" style={{ margin: '0 auto 24px', display: 'block' }} />
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
              Ready to transform your data?
            </h2>
            <p style={{ color: 'rgba(160,180,220,0.75)', marginBottom: '36px', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Join thousands of analysts and businesses using AutoDash.
            </p>
            <Link to="/auth" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="btn-primary pulse-glow"
                style={{ padding: '16px 40px', fontSize: '1.05rem' }}
              >
                Start Free Today
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '60px 24px 40px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2563EB, #60A5FA)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="white" fill="white" />
                </div>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.15rem', background: 'linear-gradient(135deg, #60A5FA, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AutoDash</span>
              </div>
              <p style={{ color: 'rgba(160,180,220,0.6)', fontSize: '0.88rem', lineHeight: 1.65 }}>
                Transform your CSV data into stunning interactive dashboards instantly.
              </p>
            </div>
            <FooterLinks title="Product" links={[['Features', '#features'], ['How It Works', '#how']]} />
            <FooterLinks title="Company" links={[['About', '#'], ['Blog', '#'], ['Careers', '#']]} />
            <FooterLinks title="Legal" links={[['Privacy', '#'], ['Terms', '#'], ['Security', '#']]} />
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ color: 'rgba(160,180,220,0.5)', fontSize: '0.85rem' }}>© 2026 AutoDash. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['𝕏', 'in', '⊕'].map(icon => (
                <motion.a
                  key={icon}
                  href="#"
                  whileHover={{ scale: 1.2 }}
                  style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(200,215,255,0.7)', textDecoration: 'none', fontSize: '0.9rem',
                  }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────── */
function SectionHeader({ tag, title, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      style={{ textAlign: 'center', marginBottom: '24px' }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', boxShadow: '0 0 12px rgba(37,99,235,0.8)' }} />
        <span style={{ color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{tag}</span>
      </div>
      <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>{title}</h2>
      {sub && <p style={{ color: 'rgba(160,180,220,0.75)', fontSize: '1rem', maxWidth: '540px', margin: '0 auto', lineHeight: 1.65 }}>{sub}</p>}
    </motion.div>
  );
}


function FooterLinks({ title, links }) {
  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem' }}>{title}</h4>
      <ul style={{ listStyle: 'none' }}>
        {links.map(([label, href]) => (
          <li key={label} style={{ marginBottom: '10px' }}>
            <Link to={href} style={{ color: 'rgba(160,180,220,0.6)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.target.style.color = '#60A5FA'}
              onMouseLeave={e => e.target.style.color = 'rgba(160,180,220,0.6)'}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
