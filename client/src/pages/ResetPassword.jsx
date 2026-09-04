import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!form.password || !form.confirmPassword) {
      setError('Enter and confirm your new password.');
      return;
    }

    if (form.password.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Invalid password reset link.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            newPassword: form.password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to reset your password.',
        );
      }

      setMessage(data.message);

      setForm({
        password: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-side-panel">
        <Link className="home-brand" to="/">
          <span className="brand-mark">P</span>
          <span>Prep With Pro</span>
        </Link>

        <div className="auth-side-copy">
          <p className="eyebrow">Account recovery</p>

          <h1>
            A fresh start.<br />
            <em>Keep moving.</em>
          </h1>

          <p>
            Create a new password and get back to your preparation.
          </p>
        </div>

        <span className="auth-side-footer">02 / 02</span>
      </div>

      <section className="auth-form-wrap">
        <div className="auth-form-card glass-card">
          <p className="eyebrow">Reset password</p>

          <h2>Create a new password</h2>

          <p className="auth-intro">
            Choose a new password for your Prep With Pro account.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="password">New password</label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={updateField}
              placeholder="6+ characters"
            />

            <label htmlFor="confirmPassword">
              Confirm new password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={updateField}
              placeholder="Repeat password"
            />

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="form-success" role="status">
                {message}
              </p>
            )}

            <button
              className="btn btn-primary auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Resetting password...' : 'Reset password'}
            </button>
          </form>

          <p className="auth-switch">
            Remember your password?{' '}
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default ResetPassword;