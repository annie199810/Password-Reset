import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:10000';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fallbackLink, setFallbackLink] = useState(null);

  function validateEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setStatus({ type: '', text: '' });
    setPreviewUrl(null);
    setFallbackLink(null);

    if (!validateEmail(email)) {
      setStatus({ type: 'error', text: 'Please enter a valid email.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (res.ok) {
        
        if (data && data.previewUrl) {
          setPreviewUrl(data.previewUrl);
          setStatus({ type: 'success', text: 'Preview available — open link to view the reset email.' });
        } else if (data && data.fallbackLink) {
          setFallbackLink(data.fallbackLink);
          setStatus({ type: 'success', text: 'Reset link generated (fallback).' });
        } else {
          setStatus({ type: 'success', text: 'If the email exists, a reset link has been sent.' });
        }
      } else {
        
        const msg = data && (data.error || data.message) ? (data.error || data.message) : 'Request failed.';
        setStatus({ type: 'error', text: msg });
      }
    } catch (err) {
      console.error('Forgot request error:', err);
      setLoading(false);
      setStatus({ type: 'error', text: 'Cannot contact server. Check backend or REACT_APP_API_URL.' });
    }
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div className="icon"><i className="bi bi-lock-fill"></i></div>
        <div className="form-title">Forgot password</div>
        <div className="form-sub">Enter your account email and we'll send a secure reset link.</div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="form-text">We will never share your email.</div>
        </div>

        {status.text && (
          <div
            className={`mt-3 alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}
            role="alert"
          >
            {status.text}
          </div>
        )}

        {previewUrl && (
          <div className="mt-2">
            <div style={{ marginBottom: 6, fontSize: 14, color: '#444' }}>Preview URL (demo):</div>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">{previewUrl}</a>
          </div>
        )}

        {fallbackLink && (
          <div className="mt-2">
            <div style={{ marginBottom: 6, fontSize: 14, color: '#444' }}>Fallback reset link:</div>
            <a href={fallbackLink} target="_blank" rel="noopener noreferrer">{fallbackLink}</a>
          </div>
        )}

        <button className="btn btn-primary mt-3" type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        <div className="note" style={{ marginTop: 12 }}>
          Use seeded test account <strong>test@example.com</strong> for demo (password: <strong>test1234</strong>).
        </div>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          Back to <Link to="/login">Sign in</Link>.
        </div>
      </form>
    </div>
  );
}
