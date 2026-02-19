import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // For now: fake login + redirect based on role
    if (role === "student") {
      navigate("/student-dashboard"); // we’ll create this later
    } else {
      navigate("/shopkeeper-dashboard"); // we’ll create this later
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="title">Campus Stationery</h2>
        <p className="subtitle">Login to continue</p>

        <form onSubmit={handleLogin}>
          <label>Login as</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="shopkeeper">Shopkeeper</option>
          </select>

          <label>Email</label>
          <input
            type="email"
            placeholder={
              role === "student"
                ? "your.email@college.edu"
                : "shopkeeper@store.com"
            }
            required
          />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" required />

          <button type="submit">
            Login as {role === "student" ? "Student" : "Shopkeeper"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;