import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resendVerificationEmail } = useAuth();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  // Prevent duplicate verification requests in React StrictMode
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    async function verifyEmail() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to verify email.",
          );
        }

        setStatus("success");
        setMessage(data.message);

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } catch (error) {
        setStatus("error");
        setMessage(error.message);
      }
    }

    if (token) {
      verifyEmail();
    } else {
      setStatus("error");
      setMessage("Verification token is missing.");
    }
  }, [token, navigate]);

  async function handleResend(event) {
    event.preventDefault();

    setResendMessage("");
    setResendError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setResendError("Please enter your email address.");
      return;
    }

    setResending(true);

    try {
      const data = await resendVerificationEmail(
        normalizedEmail,
      );

      setResendMessage(
        data.message ||
          "If an unverified account with that email exists, a verification email has been sent.",
      );
    } catch (error) {
      setResendError(error.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-page">
      {/* Left Side */}
      <div className="auth-side-panel">
        <Link className="home-brand" to="/">
          <span className="brand-mark">P</span>
          <span>Prep With Pro</span>
        </Link>

        <div className="auth-side-copy">
          <p className="eyebrow">Your preparation, in focus</p>

          <h1>
            Prepare better.
            <br />
            <em>Go further.</em>
          </h1>

          <p>
            Your personal preparation workspace starts here.
          </p>
        </div>

        <span className="auth-side-footer">01 / 02</span>
      </div>

      {/* Right Side */}
      <section className="auth-form-wrap">
        <div className="auth-form-card glass-card">
          {status === "verifying" && (
            <>
              <p className="eyebrow">Please wait</p>

              <h2>Verifying your email</h2>

              <p className="auth-intro">
                We're verifying your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <p className="eyebrow">
                Verification complete
              </p>

              <h2>Email verified! 🎉</h2>

              <p className="form-success" role="status">
                {message}
              </p>

              <p className="auth-intro">
                Your account is now active.
              </p>

              <p className="auth-intro">
                Redirecting you to the login page...
              </p>

              <Link
                className="btn btn-primary auth-submit"
                to="/login"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="eyebrow">
                Verification link expired
              </p>

              <h2>Verify your email</h2>

              <p className="auth-intro">
                {message ||
                  "This verification link is no longer valid."}
              </p>

              <p className="auth-intro">
                Enter your email address below and we'll send
                you a new verification link.
              </p>

              <form onSubmit={handleResend} noValidate>
                <label htmlFor="verification-email">
                  Email address
                </label>

                <input
                  id="verification-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                />

                {resendError && (
                  <p className="form-error" role="alert">
                    {resendError}
                  </p>
                )}

                {resendMessage && (
                  <p className="form-success" role="status">
                    {resendMessage}
                  </p>
                )}

                <button
                  className="btn btn-primary auth-submit"
                  type="submit"
                  disabled={resending}
                >
                  {resending
                    ? "Sending..."
                    : "Send new verification link"}
                </button>
              </form>

              <p className="auth-switch">
                Already verified?{" "}
                <Link to="/login">Go to login</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default VerifyEmail;