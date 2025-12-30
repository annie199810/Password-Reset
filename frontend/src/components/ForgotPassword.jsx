import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {

  // ✅ Using REACT_APP_API_URL (as per your project)
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
      setStatus({
        type: "error",
        text: "Please enter a valid email address."
      });
      return;
    }

    if (!API) {
      console.error("❌ REACT_APP_API_URL is missing");
      setStatus({
        type: "error",
        text: "Server configuration error."
      });
      return;
    }

    setLoading(true);

    console.log("🔗 API BASE URL:", API);
    console.log("📨 Forgot password request for:", email);

    try {
      const res = await fetch(`${API}/api/auth/request-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));
      console.log("📩 Server response:", data);

      if (res.ok) {
        setStatus({
          type: "success",
          text: "If the email exists, a reset link has been sent."
        });
      } else {
        setStatus({
          type: "error",
          text: data.error || data.message || "Request failed."
        });
      }
    } catch (err) {
      console.error("❌ Forgot password error:", err);
      setStatus({
        type: "error",
        text: "Cannot contact server. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header text-center">
        <div className="icon mb-2">
          <i className="bi bi-lock-fill"></i>
        </div>

        <h2 className="form-title">Forgot password</h2>

        <p className="form-sub">
          Enter your account email and we'll send a secure reset link.
        </p>
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

          <small className="form-text text-muted">
            We will never share your email.
          </small>
        </div>

        {status.text && (
          <div
            className={`alert mt-3 ${
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
          className="btn btn-primary mt-3 w-100"
          disabled={loading}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>

        <div className="note mt-3" style={{ fontSize: 14 }}>
          Demo account: <strong>test@example.com</strong>  
          <br />
          Password: <strong>test1234</strong>
        </div>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          Back to <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
