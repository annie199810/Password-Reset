import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const API = process.env.REACT_APP_API_URL || "http://localhost:10000";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  function validateEmail(value) {
    return /\S+@\S+\.\S+/.test(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    if (!validateEmail(email)) {
      setStatus({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (res.ok) {
        setStatus({
          type: "success",
          text: "If the email exists, a reset link has been sent."
        });
      } else {
        setStatus({
          type: "error",
          text: data.error || data.message || "Request failed. Try again."
        });
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setLoading(false);
      setStatus({
        type: "error",
        text: "Cannot contact server. Please try again later."
      });
    }
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div className="icon">
          <i className="bi bi-lock-fill"></i>
        </div>
        <div className="form-title">Forgot password</div>
        <div className="form-sub">
          Enter your account email and we'll send a secure reset link.
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="form-text">
            We will never share your email.
          </div>
        </div>

        {status.text && (
          <div
            className={`mt-3 alert ${
              status.type === "success"
                ? "alert-success"
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
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>

        <div className="note" style={{ marginTop: 12 }}>
          Use seeded test account <strong>test@example.com</strong> for demo
          (password: <strong>test1234</strong>).
        </div>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          Back to <Link to="/login">Sign in</Link>.
        </div>
      </form>
    </div>
  );
}
