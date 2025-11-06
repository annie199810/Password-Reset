import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const email = params.get('email');

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (!password || password.length < 6) {
      setStatus({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token, password }),
        }
      );
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setStatus({ type: 'success', text: 'Password changed successfully! Redirecting…' });
        setTimeout(() => navigate('/'), 2000);
      } else setStatus({ type: 'error', text: data.error || 'Invalid or expired link.' });
    } catch (err) {
      setLoading(false);
      setStatus({ type: 'error', text: 'Cannot connect to server.' });
    }
  }

  if (!token || !email)
    return (
      <div className="form-card mx-auto">
        <div className="card-header">
          <div className="icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div className="form-title">Invalid or Expired Link</div>
          <div className="form-sub">
            The reset link is invalid or has expired. Please request a new one.
          </div>
        </div>
      </div>
    );

  return (
    <div className="form-card mx-auto">
      <div className="card-header">
        <div className="icon">
          <i className="bi bi-shield-lock-fill"></i>
        </div>
        <div className="form-title">Reset your password</div>
        <div className="form-sub">Enter your new password below to complete the reset process.</div>
      </div>

      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label" htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {status.text && (
          <div
            className={`mt-3 alert ${
              status.type === 'success' ? 'alert-success' : 'alert-danger'
            }`}
          >
            {status.text}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Change Password'}
        </button>

        <div className="note">
          Link valid only for <strong>1 hour</strong>. After that, request a new reset link.
        </div>
      </form>
    </div>
  );
}
