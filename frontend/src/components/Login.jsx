import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        return;
      }

     
      localStorage.setItem("token", data.token);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed", err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Sign in</h2>
        <p>Use your account to sign in.</p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit">Sign in</button>
        </form>

        <p className="forgot">
          Forgot your password?{" "}
          <span
            className="link"
            onClick={() => navigate("/forgot-password")}
            style={{ cursor: "pointer", color: "#6c63ff" }}
          >
            Reset it.
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
