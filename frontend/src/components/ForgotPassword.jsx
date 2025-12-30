import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const API = process.env.REACT_APP_API_URL || "http://localhost:10000";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [demoLink, setDemoLink] = useState("");

  function validateEmail(value) {
    return /\S+@\S+\.\S+/.test(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "" });
    setDemoLink("");

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

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setStatus({
          type: "success",
          text: "If the email exists, a reset link has been sent."
        });

        // 👇 SHOW LINK FOR DEMO
        if (data.demoResetLink) {
          console.log("🔗 Demo reset link:", data.demoResetLink);
          setDemoLink(data.demoResetLink);
        }
      } else {
        setStatus({
          type: "error",
          text: data.error || "Request failed. Try again."
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
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {status.text && (
          <div
            className={`mt-3 alert ${
              status.type === "success"
                ? "alert-success"
                : "alert-danger"
            }`}
          >
            {status.text}
          </div>
        )}

        {/* 🔥 DEMO RESET LINK */}
        {demoLink && (
          <div className="alert alert-warning mt-3">
            <strong>Demo Reset Link:</strong>
            <br />
            <a href={demoLink} target="_blank" rel="noreferrer">
              {demoLink}
            </a>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary mt-3"
          disabled={loading}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>

        <div className="note mt-2">
          Demo account: <strong>test@example.com</strong> (password: test1234)
        </div>

        <div style={{ marginTop: 12 }}>
          Back to <Link to="/login">Sign in</Link>.
        </div>
      </form>
    </div>
  );
}
