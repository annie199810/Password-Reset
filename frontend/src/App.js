import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const token = typeof window !== 'undefined' && localStorage.getItem('token');

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="header">
          <div style={{ position:'absolute', left:18 }}>
            {token ? <Link to="/dashboard" className="btn btn-link">Dashboard</Link> : null}
          </div>
          <div className="brand">Secure Account — Password Reset</div>
        </header>
        <main className="main-wrap">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <Link to="/" className="btn btn-link">Forgot</Link> |
              <Link to="/login" className="btn btn-link">Login</Link> |
              <Link to="/register" className="btn btn-link">Register</Link>
            </div>

            <Routes>
              <Route path="/" element={<ForgotPassword />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </main>
        <footer>© {new Date().getFullYear()} — Password Reset Demo</footer>
      </div>
    </BrowserRouter>
  );
}
