import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Enter your email address.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to process your request.');
      }

      setMessage(data.message);
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
            Get back<br />
            <em>to your preparation.</em>
          </h1>

          <p>
            We'll send you a secure link to create a new password.
          </p>
        </div>

        <span className="auth-side-footer">02 / 02</span>
      </div>

      <section className="auth-form-wrap">
        <div className="auth-form-card glass-card">
          <p className="eyebrow">Forgot password</p>

          <h2>Reset your password</h2>

          <p className="auth-intro">
            Enter the email address associated with your account.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
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
              {submitting ? 'Sending...' : 'Send reset link'}
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

export default ForgotPassword;