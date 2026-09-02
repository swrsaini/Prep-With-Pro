import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-side-panel">
        <Link className="home-brand" to="/"><span className="brand-mark">P</span><span>Prep With Pro</span></Link>
        <div className="auth-side-copy"><p className="eyebrow">Your preparation, in focus</p><h1>Pick up<br /><em>where you left off.</em></h1><p>Your question bank and progress are ready when you are.</p></div>
        <span className="auth-side-footer">01 / 02</span>
      </div>
      <section className="auth-form-wrap">
        <div className="auth-form-card glass-card">
          <p className="eyebrow">Welcome back</p>
          <h2>Log in to your workspace</h2>
          <p className="auth-intro">Continue the work you started.</p>
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="you@example.com" />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={updateField} placeholder="Enter your password" />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Log in'}</button>
          </form>
          <p className="auth-switch">New to Prep With Pro? <Link to="/register">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}

export default Login;
