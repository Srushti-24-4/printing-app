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
  
  // Initialize state from LocalStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/"; // Force clean redirect
  };

  // Define which paths should NOT have a navbar
  // Note: Added /shopkeeper-dashboard and /inventory to hide list 
  const hideNavbarOn = ["/", "/register", "/shopkeeper-dashboard", "/inventory"];
  const shouldShowNavbar = user && !hideNavbarOn.includes(location.pathname);

  return (
    <div className="app-container">
      {shouldShowNavbar && <Navbar user={user} onLogout={handleLogout} />}
      
      <Routes>
        {/* Updated root route to handle both roles */}
        <Route 
          path="/" 
          element={
            !user ? (
              <Login setUser={setUser} />
            ) : user.role === "Admin" ? (
              <Navigate to="/shopkeeper-dashboard" />
            ) : (
              <Navigate to="/student-dashboard" />
            )
          } 
        />

        <Route path="/register" element={<Register />} />

        {/* Student Protected Routes */}
        <Route path="/student-dashboard" element={user ? <StudentDashboard /> : <Navigate to="/" />} />
        <Route path="/my-orders" element={user ? <MyOrders /> : <Navigate to="/" />} />
        <Route path="/printing-page" element={user ? <PrintingPage /> : <Navigate to="/" />} />
        <Route path="/cart" element={user ? <Cart /> : <Navigate to="/" />} />
        
        {/* Admin Protected Routes */}
        <Route path="/shopkeeper-dashboard" element={user && user.role === "Admin" ? <ShopkeeperDashboard /> : <Navigate to="/" />} />
        <Route path="/inventory" element={user && user.role === "Admin" ? <InventoryPage /> : <Navigate to="/" />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;