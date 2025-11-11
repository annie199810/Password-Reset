import React, { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fallbackLink, setFallbackLink] = useState(null);

  function validateEmail(e) { return /\S+@\S+\.\S+/.test(e); }

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    setPreviewUrl(null);
    setFallbackLink(null);

    if (!validateEmail(email)) {
      setStatus({ type: 'error', text: 'Please enter a valid email.' });
      return;
    }

    setLoading(true);

    const API = 'http://localhost:5000';

    try {
      const res = await fetch(`${API}/api/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        if (data && data.previewUrl) {
          setPreviewUrl(data.previewUrl);
          setStatus({ type: 'success', text: 'Preview link returned — open it to view the reset email.' });
        } else if (data && data.fallbackLink) {
          setFallbackLink(data.fallbackLink);
          setStatus({ type: 'success', text: 'Reset link generated (fallback). Open link below to continue.' });
        } else {
          setStatus({ type: 'success', text: 'If the email exists, a reset link has been sent.' });
        }
      } else {
        setStatus({ type: 'error', text: data && data.error ? data.error : 'Something went wrong.' });
      }
    } catch (err) {
      setLoading(false);
      console.error('Request error:', err);
      setStatus({ type: 'error', text: 'Cannot connect to server. Please make sure backend is running.' });
    }
  }

  return (
    <div className="form-card mx-auto">
      <div className="card-header">
        <div className="icon"><i className="bi bi-lock-fill"></i></div>
        <div className="form-title">Forgot password</div>
        <div className="form-sub">Enter your account email and we'll send a secure reset link.</div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="form-text">We will never share your email.</div>
        </div>

        {status.text && (
          <div className={`mt-3 alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
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
            <div style={{ marginBottom: 6, fontSize: 14, color: '#444' }}>Fallback link (logged):</div>
            <a href={fallbackLink} target="_blank" rel="noopener noreferrer">{fallbackLink}</a>
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        <div className="note" style={{ marginTop: 12 }}>
          Use seeded test account <strong>test@example.com</strong> for demo (Ethereal preview).
        </div>
      </form>
    </div>
  );
}
