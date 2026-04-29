import { motion } from 'framer-motion';
import { CheckCircle, Zap, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const plans = [
  {
    plan: 'Free',
    price: '₹0',
    period: 'forever',
    desc: 'Perfect for getting started',
    features: [
      '5 CSV uploads per month',
      'Basic Bar, Line & Pie charts',
      'CSV data export',
      'Email support',
      '100MB file size limit',
    ],
    color: 'rgba(255,255,255,0.1)',
    border: 'rgba(255,255,255,0.09)',
    featured: false,
  },
  {
    plan: 'Pro',
    price: '₹50',
    period: 'per month',
    desc: 'For power users & teams',
    features: [
      'Unlimited CSV uploads',
      'All chart types + customization',
      'CSV & PDF export',
      'Priority support (24h)',
      'Advanced AI insights',
      '1GB file size limit',
      'Dashboard history',
    ],
    color: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(37,99,235,0.08))',
    border: 'rgba(37,99,235,0.45)',
    featured: true,
  },
];

export default function PricingPage() {
  const { user, upgradePlan } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    if (user.plan === 'pro') {
      toast('You already have Pro! 🎉', { icon: '⭐' });
      return;
    }
    upgradePlan();
    toast.success('Upgraded to Pro! 🚀 Unlimited access unlocked.');
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '68px', background: '#050B18', position: 'relative' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 32, background: 'rgba(37,99,235,0.1)',
            border: '1px solid rgba(37,99,235,0.25)', borderRadius: 10,
            padding: '9px 16px', color: '#60A5FA', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Go Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', boxShadow: '0 0 12px rgba(37,99,235,0.8)' }} />
            <span style={{ color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pricing</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Simple, <span className="gradient-text">transparent pricing</span>
          </h1>
          <p style={{ color: 'rgba(160,180,220,0.7)', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto' }}>
            Start free, upgrade when you need more power. No hidden fees.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', alignItems: 'start' }}>
          {plans.map((plan, i) => (
            <motion.div
              key={plan.plan}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="glass-card glow-border"
              style={{
                padding: '40px 32px',
                background: plan.color,
                border: `1px solid ${plan.border}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {plan.featured && (
                <>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, #2563EB, #60A5FA, #818CF8)',
                  }} />
                  <div style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                    borderRadius: '100px', padding: '4px 12px',
                    fontSize: '0.72rem', fontWeight: 700,
                  }}>MOST POPULAR</div>
                  {/* Glow blob */}
                  <div style={{
                    position: 'absolute', bottom: '-60px', right: '-60px',
                    width: '200px', height: '200px',
                    background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                  }} />
                </>
              )}

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: plan.featured ? '#60A5FA' : 'rgba(160,180,220,0.65)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {plan.plan}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{plan.price}</span>
                  <span style={{ color: 'rgba(160,180,220,0.6)', fontSize: '0.88rem' }}>/ {plan.period}</span>
                </div>
                <p style={{ color: 'rgba(160,180,220,0.65)', fontSize: '0.88rem' }}>{plan.desc}</p>
              </div>

              <div style={{ margin: '24px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              <ul style={{ listStyle: 'none', marginBottom: '36px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '13px', fontSize: '0.92rem', color: 'rgba(210,225,255,0.88)' }}>
                    <CheckCircle size={16} color={plan.featured ? '#34D399' : '#60A5FA'} />
                    {f}
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={plan.featured ? handleUpgrade : undefined}
                style={{
                  width: '100%',
                  background: plan.featured ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : 'rgba(255,255,255,0.06)',
                  border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  borderRadius: '13px', padding: '15px',
                  fontWeight: 700, fontSize: '0.97rem', cursor: 'pointer',
                  boxShadow: plan.featured ? '0 6px 24px rgba(37,99,235,0.5)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {plan.featured && <Zap size={17} fill="white" />}
                {plan.featured
                  ? (user?.plan === 'pro' ? 'Current Plan ✓' : 'Upgrade to Pro')
                  : 'Get Started Free'}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* FAQ teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ textAlign: 'center', marginTop: '60px', color: 'rgba(160,180,220,0.55)', fontSize: '0.88rem' }}
        >
          Questions? <a href="mailto:support@autodash.app" style={{ color: '#60A5FA', textDecoration: 'none' }}>support@autodash.app</a>
          <span style={{ margin: '0 12px' }}>·</span>
          30-day money-back guarantee on Pro
        </motion.div>
      </div>
    </div>
  );
}
