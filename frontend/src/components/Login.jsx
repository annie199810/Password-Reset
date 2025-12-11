
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!email || !password) return setStatus({ type: 'error', text: 'Email and password are required.' });

    setLoading(true);
    const API = process.env.REACT_APP_API_URL || 'http://localhost:10000';

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        if (data.token) localStorage.setItem('token', data.token);
        setStatus({ type: 'success', text: 'Login successful. Redirecting…' });
        setTimeout(() => navigate('/'), 900);
      } else {
        setStatus({ type: 'error', text: data.error || 'Invalid credentials.' });
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setStatus({ type: 'error', text: 'Cannot connect to server.' });
    }
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div className="icon"><i className="bi bi-box-arrow-in-right"></i></div>
        <div className="form-title">Sign in</div>
        <div className="form-sub">Use your account to sign in.</div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        {status.text && <div className={`mt-3 alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}>{status.text}</div>}

        <button className="btn btn-primary mt-3" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <div className="note" style={{ marginTop: 12 }}>
          Forgot your password? <Link to="/forgot-password">Reset it</Link>.
        </div>
      </form>
    </div>
  );
}
