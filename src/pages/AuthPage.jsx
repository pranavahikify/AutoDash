import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // login | signup
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (mode === 'signup' && !form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! 👋');
        navigate('/dashboard');
      } else {
        await signup(form.email, form.password, form.name);
        toast.success('Check your email to verify your account! 📧', { duration: 6000 });
        setMode('login');
        setForm({ ...form, password: '' });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setErrors({});
    setForm({ name: '', email: '', password: '' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(37,99,235,0.18) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(129,140,248,0.12) 0%, transparent 50%), #050B18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '100px 24px 40px',
      position: 'relative',
    }}>
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}
      >
        {/* Card */}
        <div className="glass-card" style={{
          padding: '48px 40px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{
                  width: 42, height: 42,
                  background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
                }}>
                  <Zap size={22} color="white" fill="white" />
                </div>
                <span style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800,
                  background: 'linear-gradient(135deg, #60A5FA, #2563EB)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>AutoDash</span>
              </div>
            </Link>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
              >
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h1>
                <p style={{ color: 'rgba(160,180,220,0.7)', fontSize: '0.92rem' }}>
                  {mode === 'login' ? 'Sign in to your AutoDash account' : 'Start your data journey today'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Toggle */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px', padding: '4px', marginBottom: '28px',
          }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => switchMode()}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: '9px', border: 'none',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  transition: 'all 0.25s ease',
                  background: mode === m ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(160,180,220,0.7)',
                  boxShadow: mode === m ? '0 4px 16px rgba(37,99,235,0.4)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: '16px' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <FieldWrapper icon={<User size={17} />} error={errors.name}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="glass-input"
                      style={{ paddingLeft: '44px' }}
                    />
                  </FieldWrapper>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginBottom: '16px' }}>
              <FieldWrapper icon={<Mail size={17} />} error={errors.email}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="glass-input"
                  style={{ paddingLeft: '44px' }}
                />
              </FieldWrapper>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <FieldWrapper
                icon={<Lock size={17} />}
                error={errors.password}
                suffix={
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(160,180,220,0.6)', display: 'flex', alignItems: 'center' }}>
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              >
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="glass-input"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                />
              </FieldWrapper>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'rgba(160,180,220,0.6)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={switchMode} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function FieldWrapper({ icon, error, suffix, children }) {
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          color: 'rgba(160,180,220,0.5)', display: 'flex', alignItems: 'center', zIndex: 1,
        }}>
          {icon}
        </span>
        {children}
        {suffix && (
          <span style={{
            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
            zIndex: 1,
          }}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ color: '#FC8181', fontSize: '0.78rem', marginTop: '6px', paddingLeft: '4px' }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
