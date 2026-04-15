import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css"; 

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    moodle_id: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Strict Moodle ID UI Logic: Numbers only, max 8 digits
    if (name === "moodle_id") {
      const val = value.replace(/\D/g, "");
      if (val.length <= 8) {
        setFormData({ ...formData, [name]: val });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // --- Frontend Validation (Technical Leader Practice) ---
    if (formData.moodle_id.length !== 8) {
      setError("Moodle ID must be exactly 8 digits.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful! Please login.");
        navigate("/"); // Redirect to Login
      } else {
        // Handle "User already exists" or other backend errors
        setError(data.message || "Registration failed. Try a different ID/Email.");
      }
    } catch (err) {
      setError("Could not connect to the server. Is Flask running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="title">Create Account</h2>
        <p className="subtitle">Join the Campus Stationery Network</p>

        {error && (
          <div className="error-badge" style={{ 
            backgroundColor: "#ffebee", 
            color: "#c62828", 
            padding: "10px", 
            borderRadius: "5px", 
            marginBottom: "15px",
            fontSize: "0.85rem",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>College Email</label>
            <input
              type="email"
              name="email"
              placeholder="e.g. name@student.college.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Moodle ID</label>
            <input
              type="text"
              name="moodle_id"
              value={formData.moodle_id}
              placeholder="8-digit ID (e.g. 20231001)"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Choose a secure password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Register Now"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;