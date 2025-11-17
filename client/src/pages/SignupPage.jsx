import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../apiClient.js";

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState({ loading: false, error: null });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      const response = await api.post("/api/auth/signup", form);
      const data = response?.data;
      login({ token: data.token, user: data.user });
      navigate("/premium");
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "Signup failed.";
      setStatus({ loading: false, error: message });
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Create your BigB account</h1>
        <p className="auth-card__subtitle">
          You&apos;ll unlock Premium after checkout, but your account also saves your weekly free unlock.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="auth-form__row">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="auth-form__row">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>
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
              minLength={6}
            />
          </div>
          {status.error && (
            <p className="auth-form__error" role="alert">
              {status.error}
            </p>
          )}
          <button type="submit" className="auth-form__submit" disabled={status.loading}>
            {status.loading ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}
