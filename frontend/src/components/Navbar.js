import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation(); // Helps us highlight the active link

  return (
    <nav className="main-navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <span className="brand-icon">🎒</span>
          <span className="brand-text">CampusStore</span>
        </div>

        <div className="nav-links">
          {/* --- STUDENT LINKS --- */}
          {user?.role === 'Student' && (
            <>
              <Link to="/student-dashboard" className={location.pathname === '/student-dashboard' ? 'active' : ''}>
                Shop
              </Link>
              {/* NEW PRINTING OPTION */}
              <Link to="/printing-page" className={location.pathname === '/printing-page' ? 'active' : ''}>
                 Printing
              </Link>
              <Link to="/my-orders" className={location.pathname === '/my-orders' ? 'active' : ''}>
                My Orders
              </Link>
              <Link to="/cart" className="cart-link">
                 Cart
              </Link>
            </>
          )}

          {/* --- ADMIN / SHOPKEEPER LINKS --- */}
          {user?.role === 'Admin' && (
            <>
              <Link to="/shopkeeper-dashboard" className={location.pathname === '/shopkeeper-dashboard' ? 'active' : ''}>
                Orders
              </Link>
              <Link to="/inventory" className={location.pathname === '/inventory' ? 'active' : ''}>
                Inventory
              </Link>
            </>
          )}
        </div>

        <div className="nav-user-section">
          <div className="user-info">
            <span className="user-badge">{user?.role}</span>
            <span className="user-name">{user?.name}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}