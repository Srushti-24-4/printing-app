import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login({ setUser }) {
  const [moodleId, setMoodleId] = useState(""); // Using Moodle ID instead of email
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch("http://127.0.0.1:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        moodle_id: moodleId, 
        password: password 
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const loggedInUser = data.user;

      // 1. Save to LocalStorage (for page refreshes)
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      // 2. IMPORTANT: Update the App State!
      // This 'setUser' must be passed as a prop from App.js to Login.js
      if (typeof setUser === "function") {
        setUser(loggedInUser);
      }

      // 3. Now navigate
      console.log("Login successful, redirecting to student dashboard...");
  navigate("/student-dashboard", { replace: true });
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
          <label>Moodle ID</label>
          <input
            type="text"
            placeholder="8-digit Moodle ID"
            value={moodleId}
            maxLength="8"
            onChange={(e) => setMoodleId(e.target.value.replace(/\D/g, ""))} // Numeric only
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