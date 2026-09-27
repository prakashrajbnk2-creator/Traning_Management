import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials or login failure.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 100%)',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        padding: '36px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.75rem',
            marginBottom: '14px',
            boxShadow: '0 10px 20px rgba(79, 70, 229, 0.35)'
          }}>
            🎓
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Training Management System
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Sign in to access your role-based portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '40px' }}
                placeholder="name@tms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ fontSize: '0.775rem', color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Quick-Fill Section */}
        <div style={{ marginTop: '28px', paddingTop: '22px', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', textAlign: 'center' }}>
            ⚡ Instant Demo Login (Click to Fill)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fillCredentials('admin@tms.com', 'Admin@123')}
              className="btn btn-outline btn-sm"
              style={{ padding: '8px 4px', flexDirection: 'column', gap: '3px', background: '#f8fafc' }}
            >
              <strong style={{ color: '#4f46e5', fontSize: '0.8rem' }}>Admin</strong>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Full Access</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('john@tms.com', 'Trainer@123')}
              className="btn btn-outline btn-sm"
              style={{ padding: '8px 4px', flexDirection: 'column', gap: '3px', background: '#f8fafc' }}
            >
              <strong style={{ color: '#059669', fontSize: '0.8rem' }}>Trainer</strong>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>John Doe</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('alice@tms.com', 'Student@123')}
              className="btn btn-outline btn-sm"
              style={{ padding: '8px 4px', flexDirection: 'column', gap: '3px', background: '#f8fafc' }}
            >
              <strong style={{ color: '#0ea5e9', fontSize: '0.8rem' }}>Student</strong>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Alice (CS101)</span>
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} style={{ color: '#10b981' }} />
          <span>Secured with bcrypt password hashing & JWT tokens</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
