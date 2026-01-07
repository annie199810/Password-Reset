import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function validateEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!validateEmail(email)) {
      return setStatus({ type: 'error', text: 'Please enter a valid email.' });
    }

    if (!password || password.length < 6) {
      return setStatus({
        type: 'error',
        text: 'Password must be at least 6 characters.'
      });
    }

    setLoading(true);

  
    const API = "https://password-reset-2-qkox.onrender.com";

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Demo User",   
          email,
          password
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setStatus({
          type: 'success',
          text: 'Account created. Redirecting to login…'
        });
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setStatus({
          type: 'error',
          text: data.error || data.message || 'Registration failed.'
        });
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setStatus({
        type: 'error',
        text: 'Cannot connect to server.'
      });
    }
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div className="icon">
          <i className="bi bi-person-plus-fill"></i>
        </div>
        <div className="form-title">Create an account</div>
        <div className="form-sub">
          Register a new account to use the demo.
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {status.text && (
          <div className={`mt-3 alert ${
            status.type === 'success' ? 'alert-success' : 'alert-danger'
          }`}>
            {status.text}
          </div>
        )}

        <button
          className="btn btn-primary mt-3"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
