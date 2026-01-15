"use client";

import { useState } from "react";
import Header from "@/app/home/components/Header";
import Footer from "@/app/home/components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email validation (simple regex)
  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Replace below with real API endpoint
      // For demo, we'll just timeout and pretend success
      await new Promise((res) => setTimeout(res, 1200));

      setSubmitted(true);
    } catch (err) {
      setError("Failed to send reset instructions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* <Header /> */}
      <div
        className="min-vh-100 d-flex justify-content-center align-items-center"
        style={{ background: "#f3f5fe" }}
      >
        <div
          className="bg-white rounded-4 shadow-card w-100 "
          style={{ maxWidth: "500px" }}
        >
          {/* Header */}
          <div className="text-center py-4 border-bottom">
            <h6 className="mb-0 fw-semibold text-dark">Forgot Password</h6>
          </div>

          <div className="px-4 py-5">
            {submitted ? (
              <div className="text-center">
                <div className="mb-3 text-success fs-1">
                  <i className="bi bi-check-circle"></i>
                </div>
                <h5 className="fw-bold mb-2">Check your email</h5>
                <p className="text-muted mb-0">
                  Password reset instructions have been sent to <span className="fw-semibold">{email}</span>.<br />
                  If an account exists for this email, you&apos;ll receive a link to reset your password.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-center">
                  <p className="mb-2 text-muted">
                    Enter your email address and we&apos;ll send you instructions to reset your password.
                  </p>
                </div>
                <form onSubmit={handleSubmit} autoComplete="off">
                  <div className="mb-3">
                    <label htmlFor="email" className="fw-semibold small text-dark mb-1">
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <div className="alert alert-danger py-1 px-2 small mb-3">{error}</div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Instructions"
                    )}
                  </button>
                </form>
              </>
            )}
            <div className="mt-4 text-center">
              <a href="/auth/login" className="text-primary text-decoration-underline small">
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
}

