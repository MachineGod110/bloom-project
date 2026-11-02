import React, { useState } from "react";
import { signup, login } from "../services/api";

export default function AuthModal({ mode, onClose, onSwitchMode, onAuthed }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (isSignup && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      const result = isSignup
        ? await signup({ name: name.trim(), email: email.trim(), password })
        : await login({ email: email.trim(), password });
      onAuthed(result);
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-modal">
        <button className="close-modal" onClick={onClose} aria-label="Close">
          ×
        </button>

        {isSignup ? (
          <div>
            <span className="mono">Start your journey</span>
            <h2>Bloom.</h2>
            <p className="subhead">Create your personal awareness space.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="switch-auth">
              Already have an account?{" "}
              <button type="button" onClick={() => onSwitchMode("login")}>
                Log in
              </button>
            </div>
          </div>
        ) : (
          <div>
            <span className="mono">Welcome back</span>
            <h2>Log in.</h2>
            <p className="subhead">Continue your Bloom journey.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="switch-auth">
              Don't have an account?{" "}
              <button type="button" onClick={() => onSwitchMode("signup")}>
                Create one
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
