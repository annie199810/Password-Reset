
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import HeroLeft from './components/HeroLeft';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="split-app">
        <div className="split-left">
          <HeroLeft />
        </div>

        <div className="split-right">
          <header className="small-header">
            <div className="brand">Secure Account — Password Reset</div>
          </header>

          <main className="split-main">
            <Routes>
             
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

            
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

            
              <Route path="/forgot-password" element={<ForgotPassword />} />
           
              <Route path="/reset-password" element={<ResetPassword />} />
             

              
              <Route path="*" element={<div style={{padding:24}}>Page not found</div>} />
            </Routes>
          </main>

          <footer className="split-footer">© {new Date().getFullYear()} — Password Reset Demo</footer>
        </div>
      </div>
    </BrowserRouter>
  );
}
