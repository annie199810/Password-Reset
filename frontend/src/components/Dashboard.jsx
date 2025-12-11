
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fallbackLink, setFallbackLink] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const api = process.env.REACT_APP_API_URL || 'http://localhost:10000';
        const res = await fetch(`${api}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('fetch me error', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  async function showResetLink() {
   
    const email = user && user.email ? user.email : 'test@example.com';
    setResetLoading(true);
    setResetMessage('');
    setPreviewUrl(null);
    setFallbackLink(null);

    try {
      const api = process.env.REACT_APP_API_URL || 'http://localhost:10000';
      const res = await fetch(`${api}/api/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResetLoading(false);

      if (res.ok) {
       
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
          setResetMessage('Preview link returned — open it to view the reset email.');
        } else if (data.fallbackLink) {
          setFallbackLink(data.fallbackLink);
          setResetMessage('Reset link generated (fallback). Open link below to continue.');
        } else {
          setResetMessage('If the email exists, a reset link has been sent (no preview available).');
        }
      } else {
        setResetMessage((data && (data.error || data.message)) || 'Failed to create reset link');
      }
    } catch (err) {
      console.error('request-reset error', err);
      setResetLoading(false);
      setResetMessage('Cannot connect to server.');
    }
  }

  if (loading) {
    return (
      <div className="form-card mx-auto" style={{ maxWidth: 560 }}>
        <div className="card-header">
          <div className="icon"><i className="bi bi-person-circle"></i></div>
          <div className="form-title">Loading Dashboard…</div>
        </div>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Fetching your account details…</p>
      </div>
    );
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 560 }}>
      <div className="card-header">
        <div className="icon"><i className="bi bi-person-check-fill"></i></div>
        <div className="form-title">Dashboard</div>
        <div className="form-sub">This is your secure dashboard demo.</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <p><strong>Email :</strong> {user ? user.email : 'guest@example.com'}</p>
        <p><strong>Hint :</strong> Dashboard will no longer auto-redirect (demo disabled).</p>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Go to Register</button>
          <button className="btn btn-outline" onClick={() => navigate('/login')} style={{ background: "#fff", border: "1px solid #e5e7eb" }}>Go to Login</button>
          <button className="btn btn-outline" onClick={logout} style={{ background: "#fff", border: "1px solid #e5e7eb" }}>Logout</button>
        </div>

        <hr style={{ marginTop: 20 }} />

        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Password reset (demo helper)</div>
          <div style={{ marginBottom: 8, color: '#555' }}>
            Click <strong>Show reset link</strong> to generate a reset token for the current user (or the seeded demo user if not logged in).
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={showResetLink} disabled={resetLoading}>
              {resetLoading ? 'Generating…' : 'Show reset link'}
            </button>
          </div>

          {resetMessage && <div style={{ marginTop: 12 }} className={`alert ${resetMessage.includes('failed') || resetMessage.includes('Cannot') ? 'alert-danger' : 'alert-success'}`}>{resetMessage}</div>}

          {previewUrl && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: '#444', marginBottom: 6 }}>Preview URL (demo):</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">{previewUrl}</a>
                <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(previewUrl)}>Copy</button>
              </div>
            </div>
          )}

          {fallbackLink && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: '#444', marginBottom: 6 }}>Fallback reset link (use this if email not delivered):</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <a href={fallbackLink} target="_blank" rel="noopener noreferrer">{fallbackLink}</a>
                <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(fallbackLink)}>Copy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
