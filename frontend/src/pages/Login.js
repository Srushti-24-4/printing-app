import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Login() {
  const [moodleId, setMoodleId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodle_id: moodleId, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ CORRECTED: Save a clean object to localStorage
        // This is the "ID Badge" your other pages will look for
        localStorage.setItem("user", JSON.stringify({
          moodle_id: data.user.moodle_id,
          name: data.user.name,
          role: data.user.role
        }));

        // Redirect based on role
        if (data.user.role === "Admin") {
          navigate("/shopkeeper-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      } else {
        alert(data.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server is down. Please check your Flask backend!");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Campus Login</h2>
        <p className="auth-subtitle">Welcome back, Student!</p>
        <form onSubmit={handleLogin}>
          <label>Moodle ID</label>
          <input 
            type="text" 
            maxLength="8" 
            placeholder="Enter 8-digit ID"
            value={moodleId}
            // ✅ Good logic here: keeps it numeric only
            onChange={(e) => setMoodleId(e.target.value.replace(/\D/g, ""))}
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
          <button type="submit" className="auth-btn">Login</button>
        </form>
        <p style={{ textAlign: "center", marginTop: "15px", fontSize: "0.9rem" }}>
          New student? <Link to="/register" style={{ color: "#2f2fa2", fontWeight: "bold", textDecoration: "none" }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;