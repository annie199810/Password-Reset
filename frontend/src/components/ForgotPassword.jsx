import React, { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resetLink, setResetLink] = useState(null);

  function validateEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }

  async function submit(e) {
    e.preventDefault();

    setStatus({ type: '', text: '' });
    setPreviewUrl(null);
    setResetLink(null);

    if (!validateEmail(email)) {
      setStatus({ type: 'error', text: 'Please enter a valid email.' });
      return;
    }

    setLoading(true);

    const API = process.env.REACT_APP_API_URL || 'http://localhost:10000';

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
        }

        
        const linkFromApi =
          (data && data.resetUrl) ||
          (data && data.fallbackLink) ||
          null;

        if (linkFromApi) {
          setResetLink(linkFromApi);
          setStatus({
            type: 'success',
            text:
              'Reset link generated. Use the link below to reset your password.'
          });
        } else {
          setStatus({
            type: 'success',
            text:
              'If the email exists, a reset link has been sent.'
          });
        }
      } else {
        setStatus({
          type: 'error',
          text:
            data && (data.error || data.message)
              ? data.error || data.message
              : 'Something went wrong.'
        });
      }
    } catch (err) {
      setLoading(false);
      console.error('Request error:', err);
      setStatus({
        type: 'error',
        text: 'Cannot connect to server. Please make sure backend is running.'
      });
    }
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div className="icon"><i className="bi bi-lock-fill"></i></div>
        <div className="form-title">Forgot password</div>
        <div className="form-sub">
          Enter your account email and we'll send a secure reset link.
        </div>
      </div>

      <form onSubmit={submit} noValidate>
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
            className={`mt-3 alert ${
              status.type === 'success' ? 'alert-success' : 'alert-danger'
            }`}
            role="alert"
          >
            {status.text}
          </div>
        )}

        {previewUrl && (
          <div className="mt-2">
            <div
              style={{ marginBottom: 6, fontSize: 14, color: '#444' }}
            >
              Preview URL (demo):
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {previewUrl}
            </a>
          </div>
        )}

        {resetLink && (
          <div className="mt-2">
            <div
              style={{ marginBottom: 6, fontSize: 14, color: '#444' }}
            >
              Reset link (demo – click to continue):
            </div>
            <a
              href={resetLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {resetLink}
            </a>
          </div>
        )}

        <button
          className="btn btn-primary mt-3"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        <div className="note" style={{ marginTop: 12 }}>
          Use seeded test account <strong>test@example.com</strong> for demo
          (Ethereal preview).
        </div>
      </form>
    </div>
  );
}
