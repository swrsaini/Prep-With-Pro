import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { register, resendVerificationEmail } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Complete every field to create your account.");
      return;
    }

    if (form.password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setRegisteredEmail(form.email.trim());

      setSuccess(
        data.message ||
          "Registration successful. Please check your email to verify your account.",
      );
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!registeredEmail) return;

    setError("");
    setSuccess("");
    setResending(true);

    try {
      const data = await resendVerificationEmail(registeredEmail);

      setSuccess(
        data.message ||
          "A new verification email has been sent.",
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setResending(false);
    }
  }

  // Verification success state
  if (registeredEmail) {
    return (
      <main className="auth-page">
        <div className="auth-side-panel register-side-panel">
          <Link className="home-brand" to="/">
            <span className="brand-mark">P</span>
            <span>Prep With Pro</span>
          </Link>

          <div className="auth-side-copy">
            <p className="eyebrow">One more step</p>

            <h1>
              Check your
              <br />
              <em>inbox.</em>
            </h1>

            <p>
              Verify your email to activate your Prep With Pro
              account.
            </p>
          </div>

          <span className="auth-side-footer">02 / 02</span>
        </div>

        <section className="auth-form-wrap">
          <div className="auth-form-card glass-card">
            <p className="eyebrow">Almost there</p>

            <h2>Verify your email</h2>

            <p className="auth-intro">
              We've sent a verification link to:
            </p>

            <p>
              <strong>{registeredEmail}</strong>
            </p>

            {success && (
              <p className="form-success" role="status">
                {success}
              </p>
            )}

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <p className="auth-intro">
              Open the email and click{" "}
              <strong>Verify Email</strong> to activate
              your account.
            </p>

            <button
              className="btn btn-primary auth-submit"
              type="button"
              onClick={handleResend}
              disabled={resending}
            >
              {resending
                ? "Sending..."
                : "Resend verification email"}
            </button>

            <p className="auth-switch">
              Already verified?{" "}
              <Link to="/login">Go to login</Link>
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-side-panel register-side-panel">
        <Link className="home-brand" to="/">
          <span className="brand-mark">P</span>
          <span>Prep With Pro</span>
        </Link>

        <div className="auth-side-copy">
          <p className="eyebrow">
            Start with one good session
          </p>

          <h1>
            Build the habit.
            <br />
            <em>Trust the work.</em>
          </h1>

          <p>
            A focused practice space for the long game.
          </p>
        </div>

        <span className="auth-side-footer">02 / 02</span>
      </div>

      <section className="auth-form-wrap">
        <div className="auth-form-card glass-card">
          <p className="eyebrow">Create your account</p>

          <h2>Make preparation count</h2>

          <p className="auth-intro">
            Your personal workspace starts here.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="name">Full name</label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={updateField}
              placeholder="Your name"
            />

            <label htmlFor="email">Email address</label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
            />

            <div className="auth-field-grid">
              <div>
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="6+ characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword">
                  Confirm password
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
              </div>
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="btn btn-primary auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Creating workspace..."
                : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;