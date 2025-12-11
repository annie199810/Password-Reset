
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [err, setErr] = useState('');

  const API = process.env.REACT_APP_API_URL || 'http://localhost:10000';

  async function submit(e) {
    e.preventDefault();
    setErr('');

    if (!email || !password) {
      setErr('Please fill email and password.');
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.token) {
       
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setErr(data && (data.message || data.error) ? (data.message || data.error) : 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setErr('Cannot connect to server.');
    }
  }

  function fillDemo() {
    setEmail('test@example.com');
    setPassword('test1234');
    setErr('');
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 460, padding: 24 }}>
      <div className="card-header">
        <div className="form-title">Sign in</div>
        <div className="form-sub">Use your account to sign in.</div>
      </div>

      <form onSubmit={submit}>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" />
        </div>

        <div className="form-group" style={{ marginTop: 8 }}>
          <label>Password</label>
          <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
        </div>

        {err && <div className="alert alert-danger mt-3">{err}</div>}

        <button className="btn btn-primary mt-3" type="submit">Sign in</button>

        <div className="demo-box" style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 8,
          background: '#f5f2ff',
          border: '1px solid #eee'
        }}>
          <div style={{ fontWeight: 700 }}>Demo Login:</div>
          <div><strong>Email:</strong> test@example.com</div>
          <div><strong>Password:</strong> test1234</div>
          <button className="btn btn-outline-secondary mt-2" type="button" onClick={fillDemo}>Use Demo Credentials</button>
        </div>
      </form>
    </div>
  );
}
