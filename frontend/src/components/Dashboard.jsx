
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  
  const demoMode = false;

  useEffect(() => {
    async function fetchMe() {
      
      const token = localStorage.getItem('token');
      if (!token) {
        
      } else {
        try {
          const api = process.env.REACT_APP_API_URL || 'http://localhost:10000';
          const res = await fetch(`${api}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('fetch me error', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    }
    fetchMe();
  }, [navigate]);

 
  useEffect(() => {
    if (!demoMode) return;

    const delays = [2500, 2500, 2500]; 

    let t1, t2, t3;
    t1 = setTimeout(() => {
      navigate('/register');
      t2 = setTimeout(() => {
        navigate('/login');
        t3 = setTimeout(() => {
          navigate('/forgot'); 
        }, delays[2]);
      }, delays[1]);
    }, delays[0]);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [demoMode, navigate]);

 

  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
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
      </div>
    </div>
  );
}
