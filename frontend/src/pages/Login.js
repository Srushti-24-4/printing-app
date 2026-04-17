import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login({ setUser }) {
  const [moodleId, setMoodleId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student"); // Default role
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // 1. Check for Hardcoded Admin Credentials first
    if (role === "Admin" && moodleId === "admin" && password === "admin1234") {
      const adminUser = {
        moodle_id: "admin",
        name: "Shopkeeper",
        role: "Admin",
      };

      localStorage.setItem("user", JSON.stringify(adminUser));
      if (typeof setUser === "function") setUser(adminUser);
      
      window.location.href = "/shopkeeper-dashboard";
      return; // Exit function so it doesn't try to call the backend
    }

    // 2. Otherwise, proceed with the Student Backend Login
    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodle_id: moodleId,
          password: password,
          role: role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const loggedInUser = data.user;
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        if (typeof setUser === "function") setUser(loggedInUser);
        
        window.location.href = "/student-dashboard";
      } else {
        alert(data.error || "Login failed.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server is offline.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="title">Campus Stationery</h2>
        <p className="subtitle">Welcome back!</p>

        <form onSubmit={handleLogin}>
  {/* Role Selection */}
  <div className="role-selector">
    <label>Login As:</label>
    <select value={role} onChange={(e) => setRole(e.target.value)}>
      <option value="Student">Student</option>
      <option value="Admin">Shopkeeper / Admin</option>
    </select>
  </div>

  {/* DYNAMIC LABEL AND INPUT */}
  <label>{role === "Admin" ? "Admin Username" : "Moodle ID"}</label>
  <input
    type="text"
    placeholder={role === "Admin" ? "Enter Admin Username" : "8-digit Moodle ID"}
    value={moodleId}
    // Only apply numeric restriction if it's a Student
    onChange={(e) => {
      const val = e.target.value;
      setMoodleId(role === "Student" ? val.replace(/\D/g, "") : val);
    }}
    // Only apply maxLength if it's a Student
    maxLength={role === "Student" ? "8" : "50"} 
    required
  />

  <label>Password</label>
  <input
    type="password"
    placeholder="Enter your password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  <button type="submit" className="login-btn">
    Login
  </button>
</form>

        <p className="auth-footer">
          New student? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;