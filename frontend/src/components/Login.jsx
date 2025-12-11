import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const DEMO_EMAIL = "test@example.com";
  const DEMO_PASSWORD = "test1234";

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setStatus({ type: "info", text: "Demo credentials filled — press Sign in." });
  }

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    if (!email || !password) {
      setStatus({ type: "error", text: "Please enter both email and password." });
      return;
    }

    setLoading(true);

    const API = process.env.REACT_APP_API_URL || "http://localhost:10000";

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        setStatus({ type: "success", text: "Login successful — redirecting…" });
        setTimeout(() => navigate("/"), 700);
      } else {
        setStatus({ type: "error", text: data.error || data.message || "Invalid credentials." });
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setLoading(false);
      setStatus({ type: "error", text: "Cannot connect to server. Check backend." });
    }
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div className="icon"><i className="bi bi-box-arrow-in-right"></i></div>
        <div className="form-title">Sign in</div>
        <div className="form-sub">Use your account to sign in.</div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {status.text && (
          <div
            className={`mt-3 alert ${
              status.type === "success"
                ? "alert-success"
                : status.type === "info"
                ? "alert-info"
                : "alert-danger"
            }`}
            role="alert"
          >
            {status.text}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary mt-3"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link to="/forgot">Forgot your password? Reset it.</Link>
          </div>
          <div>
            <Link to="/register">Create an account</Link>
          </div>
        </div>

       
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#666" }}>
            <strong style={{ fontWeight: 600 }}>Demo:</strong>{" "}
            <span style={{ fontWeight: 500, color: "#333" }}>{DEMO_EMAIL} / {DEMO_PASSWORD}</span>
          </div>

         
        </div>
        
      </form>
    </div>
  );
}
