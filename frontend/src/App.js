import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import './index.css'; 

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="header">     
          <div className="brand">Secure Account — Password Reset</div>
        </header>
        <main className="main-wrap">
          <div className="container">
            <Routes>
              <Route path="/" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </div>
        </main>
        <footer>© {new Date().getFullYear()} — Password Reset Demo</footer>
      </div>
    </BrowserRouter>
  );
}
