
import React, { useState } from "react";


 
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" }); 
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fallbackLink, setFallbackLink] = useState(null);

  
  function validateEmail(value) {
    return /\S+@\S+\.\S+/.test(value);
  }


  function useDemoEmail() {
    setEmail("test@example.com");
    setStatus({ type: "", text: "" });
    setPreviewUrl(null);
    setFallbackLink(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "" });
    setPreviewUrl(null);
    setFallbackLink(null);

    if (!validateEmail(email)) {
      setStatus({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    const API = process.env.REACT_APP_API_URL || "http://localhost:10000";

    try {
      const res = await fetch(`${API}/api/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

    
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
       
      }

      setLoading(false);

      if (res.ok) {
       
        if (data && data.previewUrl) {
          setPreviewUrl(data.previewUrl);
          setStatus({
            type: "success",
            text: "Preview link returned — open it to view the reset email (demo).",
          });
          return;
        }

       
        if (data && data.fallbackLink) {
          setFallbackLink(data.fallbackLink);
          setStatus({
            type: "success",
            text: "Reset link generated (fallback). Open link below to continue.",
          });
          return;
        }

       
        setStatus({
          type: "success",
          text: "If the email exists, a reset link has been sent. Check your inbox.",
        });
      } else {
     
        const serverMessage =
          data && (data.error || data.message)
            ? data.error || data.message
            : `Request failed with status ${res.status}`;
        setStatus({ type: "error", text: serverMessage });
      }
    } catch (err) {
      setLoading(false);
      console.error("Request error:", err);
      setStatus({
        type: "error",
        text: "Cannot connect to server. Please make sure backend is running.",
      });
    }
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div className="icon" aria-hidden>
          <i className="bi bi-lock-fill"></i>
        </div>
        <div className="form-title">Forgot password</div>
        <div className="form-sub">
          Enter your account email and we'll send a secure reset link.
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-describedby="emailHelp"
          />
          <div id="emailHelp" className="form-text">
            We will never share your email.
          </div>
        </div>

        {status.text && (
          <div
            className={`mt-3 alert ${
              status.type === "success" ? "alert-success" : "alert-danger"
            }`}
            role="alert"
          >
            {status.text}
          </div>
        )}

        {previewUrl && (
          <div className="mt-2">
            <div style={{ marginBottom: 6, fontSize: 14, color: "#444" }}>
              Preview URL (demo):
            </div>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              {previewUrl}
            </a>
          </div>
        )}

        {fallbackLink && (
          <div className="mt-2">
            <div style={{ marginBottom: 6, fontSize: 14, color: "#444" }}>
              Fallback reset link:
            </div>
            <a href={fallbackLink} target="_blank" rel="noopener noreferrer">
              {fallbackLink}
            </a>
          </div>
        )}

        <div className="d-flex gap-2 mt-3">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            aria-disabled={loading}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={useDemoEmail}
            title="Fill demo email (test@example.com)"
          >
            Use Demo Email
          </button>
        </div>

        <div className="note" style={{ marginTop: 12 }}>
          <strong>Demo account for testing:</strong>
          <div>Email: <code>test@example.com</code></div>
          <div>Password: <code>test1234</code> (use Login page)</div>
          <small className="text-muted d-block mt-1">
            Note: reset link preview is available only in demo mode (Ethereal).
          </small>
        </div>
      </form>
    </div>
  );
}
