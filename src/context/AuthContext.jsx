import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking persisted session
    const stored = localStorage.getItem('autodash_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock auth – replace with real backend call
    if (!email || !password) throw new Error('Email and password are required');
    const userData = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      plan: 'free',
      uploads: 0,
      createdAt: new Date().toISOString(),
    };
    setUser(userData);
    localStorage.setItem('autodash_user', JSON.stringify(userData));
    return userData;
  };

  const signup = async (email, password, name) => {
    if (!email || !password || !name) throw new Error('All fields are required');
    const userData = {
      id: Date.now().toString(),
      email,
      name,
      plan: 'free',
      uploads: 0,
      createdAt: new Date().toISOString(),
    };
    setUser(userData);
    localStorage.setItem('autodash_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autodash_user');
  };

  const upgradePlan = () => {
    const updated = { ...user, plan: 'pro' };
    setUser(updated);
    localStorage.setItem('autodash_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, upgradePlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
