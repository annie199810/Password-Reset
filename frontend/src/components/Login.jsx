import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  
  const DEMO_EMAIL = "test@example.com";
  const DEMO_PASSWORD = "test1234";

  const API = process.env.REACT_APP_API_URL;

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    if (!email || !password) {
      return setStatus({
        type: "error",
        text: "Please enter both email and password."
      });
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setStatus({ type: "success", text: "Login successful! Redirecting…" });
        setTimeout(() => navigate("/"), 700);
      } else {
        setStatus({ type: "error", text: data.error || "Invalid credentials." });
      }
    } catch (err) {
      setLoading(false);
      setStatus({ type: "error", text: "Server not reachable." });
    }
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setStatus({ type: "info", text: "Demo credentials filled!" });
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div className="icon">
          <i className="bi bi-box-arrow-in-right"></i>
        </div>
        <div className="form-title">Sign in</div>
        <div className="form-sub">Use your account to sign in.</div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          >
            {status.text}
          </div>
        )}

        <button className="btn btn-primary mt-3" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

      
        <div
          style={{
            marginTop: 18,
            padding: 12,
            background: "#f4efff",
            border: "1px solid #d0c3ff",
            borderRadius: 8
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>Demo Login:</div>
          <div>Email: <strong>{DEMO_EMAIL}</strong></div>
          <div>Password: <strong>{DEMO_PASSWORD}</strong></div>

          <button
            type="button"
            onClick={fillDemo}
            className="btn btn-outline mt-2"
            style={{ width: "100%" }}
          >
            Use Demo Credentials
          </button>
        </div>

        <div className="note" style={{ marginTop: 20 }}>
          Forgot your password? <a href="/forgot-password">Reset it</a>.
          <br />
          Don’t have an account? <a href="/register">Create one</a>.
        </div>
      </form>
    </div>
  );
}
