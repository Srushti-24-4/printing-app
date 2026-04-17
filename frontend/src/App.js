import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Components
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import ShopkeeperDashboard from "./pages/ShopkeeperDashboard"; 
import MyOrders from "./pages/MyOrders";
import PrintingPage from "./pages/PrintingPage";
import InventoryPage from "./pages/InventoryPage";
import Cart from "./pages/Cart";

function App() {
  const location = useLocation();
  
  // 1. Initialize state from LocalStorage immediately to prevent "flicker"
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // 2. Centralized Home Logic
  const getHomeRoute = () => {
    if (!user) return "/";
    return user.role === "Admin" ? "/shopkeeper-dashboard" : "/student-dashboard";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/"; 
  };

  // 3. Navbar visibility logic
  const hideNavbarOn = ["/", "/register", "/shopkeeper-dashboard", "/inventory"];
  const shouldShowNavbar = user && !hideNavbarOn.includes(location.pathname);

  return (
    <div className="app-container">
      {/* Show Navbar only for Student routes where it is needed */}
      {shouldShowNavbar && <Navbar user={user} onLogout={handleLogout} />}
      
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route 
          path="/" 
          element={!user ? <Login setUser={setUser} /> : <Navigate to={getHomeRoute()} replace />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to={getHomeRoute()} replace />} 
        />

        {/* STUDENT PROTECTED ROUTES (Admin cannot access) */}
        <Route 
          path="/student-dashboard" 
          element={user && user.role === "Student" ? <StudentDashboard /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/my-orders" 
          element={user && user.role === "Student" ? <MyOrders /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/printing-page" 
          element={user && user.role === "Student" ? <PrintingPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/cart" 
          element={user && user.role === "Student" ? <Cart /> : <Navigate to="/" replace />} 
        />
        
        {/* ADMIN PROTECTED ROUTES (Student cannot access) */}
        <Route 
          path="/shopkeeper-dashboard" 
          element={user && user.role === "Admin" ? <ShopkeeperDashboard /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/inventory" 
          element={user && user.role === "Admin" ? <InventoryPage /> : <Navigate to="/" replace />} 
        />

        {/* CATCH-ALL: Redirect any unknown URL to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;