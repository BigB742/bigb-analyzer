import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: null });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Invalid email or password.");
      }
      login({ token: data.token, user: data.user });
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect") || "/";
      navigate(redirect);
    } catch (error) {
      setStatus({ loading: false, error: error.message || "Unable to login." });
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-card__subtitle">Log in to access your weekly unlocks and premium upgrade.</p>
        <form onSubmit={handleSubmit}>
          <div className="auth-form__row">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="auth-form__row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          {status.error && (
            <p className="auth-form__error" role="alert">
              {status.error}
            </p>
          )}
          <button type="submit" className="auth-form__submit" disabled={status.loading}>
            {status.loading ? "Logging in…" : "Log In"}
          </button>
        </form>
        <p className="auth-card__footer">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </section>
  );
}
