'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Dummy login handler for UI demo only
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (!email || !password) {
        setError('Please enter both email and password.');
        setLoading(false);
      } else if (email !== 'admin@dashboard.com' || password !== 'admin123') {
        setError('Invalid email or password.');
        setLoading(false);
      } else {
        // Simulate successful login
        router.push('/home');
      }
    }, 1000);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{background: '#f3f5fe'}}>
      <div className="container" style={{ maxWidth: 500}}>
        <div className="card shadow-card border-0">
          <div className="card-body p-4">
            <div className="text-center mb-4">
          <div
            className="mx-auto d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #ff9800, #ffb74d)",
              borderRadius: "10px",
              padding: "10px",
              border: "1px solid #dce3f1",
              fontSize: "14px",
            }}
          >
            <Image src="/robot.png" alt="AlgoBot" width={80} height={80} />
          </div>
              <h2 className="fw-bold mb-1">Welcome Back</h2>
              <div className="text-muted mb-0">Sign in to your AlgoBot account</div>
            </div>
            {error && (
              <div className="alert alert-danger py-2 small mb-3" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="mb-3">
                <label htmlFor="loginEmail" className="form-label fw-semibold">
                  Email address
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="loginEmail"
                  placeholder="you@email.com"
                  value={email}
                  autoFocus
                  autoComplete="username"
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="loginPassword" className="form-label fw-semibold">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="loginPassword"
                  placeholder="Enter your password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="mb-3 d-flex justify-content-end">
                  <a href="/auth/forgotpass" className="small text-primary text-decoration-none">
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold py-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            <div className="text-center mt-4">
              <span className="text-muted small">Don't have an account?</span>
              <a href="/auth/registration" className="ms-1 fw-semibold text-primary text-decoration-none">
                Sign Up
              </a>
            </div>
          </div>
        </div>
        <div className="text-center mt-4 small text-muted opacity-75">
          &copy; {new Date().getFullYear()} AlgoBot. All rights reserved.
        </div>
      </div>
    </div>
  );
}