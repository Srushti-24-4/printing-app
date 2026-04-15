import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
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
        // ✅ SAVE USER DATA: This is crucial for the rest of your app!
        localStorage.setItem("user", JSON.stringify({
          moodle_id: data.user.moodle_id,
          name: data.user.name,
          role: data.user.role
        }));

        // Redirect based on the role returned by the database
        if (data.user.role === "Admin") {
          navigate("/shopkeeper-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      } else {
        alert(data.error || "Login failed. Check your ID and password.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server is offline. Make sure your Flask app is running!");
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