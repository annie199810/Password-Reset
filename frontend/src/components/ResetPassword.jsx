import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const email = params.get('email');

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const redirectTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!password || password.length < 6) {
      setStatus({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:10000';
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setStatus({ type: 'success', text: '✅ Password changed successfully! Redirecting to login…' });

        redirectTimeoutRef.current = setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setStatus({ type: 'error', text: data.error || 'Invalid or expired link.' });
      }
    } catch (err) {
      setLoading(false);
      setStatus({ type: 'error', text: 'Cannot connect to server. Please try again later.' });
    }
  }

  if (!token || !email) {
    return (
      <div className="form-card mx-auto">
        <div className="card-header">
          <div className="icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
          <div className="form-title">Invalid or Expired Link</div>
          <div className="form-sub">The reset link is invalid or missing. Please request a new one.</div>
        </div>
      </div>
    );
  }

  if (status.type === 'success') {
    return (
      <div className="form-card mx-auto text-center">
        <div className="card-header">
          <div className="icon"><i className="bi bi-check-circle-fill text-success"></i></div>
          <div className="form-title">Password Reset Successful</div>
          <div className="form-sub">{status.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card mx-auto">
      <div className="card-header">
        <div className="icon"><i className="bi bi-shield-lock-fill"></i></div>
        <div className="form-title">Reset your password</div>
        <div className="form-sub">Enter your new password below to complete the reset process.</div>
      </div>

      <form onSubmit={submit} noValidate>
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
            minLength={6}
          />
        </div>

        {status.text && (
          <div
            className={`mt-3 alert text-center ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}
            role="alert"
          >
            {status.text}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Change Password'}
        </button>

        <div className="note">
          Link valid only for <strong>1 hour</strong>. If it expires, request a new reset link.
        </div>
      </form>
    </div>
  );
}
