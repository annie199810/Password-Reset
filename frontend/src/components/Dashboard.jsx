
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, [navigate]);

  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <div className="form-card mx-auto" style={{ maxWidth: 720 }}>
      <div className="card-header">
        <div className="icon"><i className="bi bi-speedometer2"></i></div>
        <div className="form-title">Welcome{user ? `, ${user.email.split('@')[0]}` : ''}</div>
        <div className="form-sub">This is your secure dashboard. Use the actions below to manage your account.</div>
      </div>

      <div style={{ padding: 12 }}>
        {loading ? <div>Loading…</div> : (
          <>
            <div style={{ marginBottom: 14 }}>
              <strong>Email:</strong> {user ? user.email : '—'}
            </div>

            <div style={{ display:'flex', gap:12, marginBottom: 6 }}>
              <button className="btn btn-primary" onClick={() => navigate('/reset-password')}>Change Password</button>
              <button className="btn btn-outline" onClick={logout} style={{ background:'#fff', border:'1px solid #e6e9f2' }}>Logout</button>
            </div>

            <div style={{ marginTop: 12, color:'#6b7280' }}>
              Last password reset: <strong>Just now</strong> (for demo)
            </div>
          </>
        )}
      </div>
    </div>
  );
}
