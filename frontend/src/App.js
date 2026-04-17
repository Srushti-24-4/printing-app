import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom"; // Added useLocation

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
  const location = useLocation(); // Get current URL
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // Define which paths should NOT have a navbar
  const hideNavbarOn = ["/", "/register", "/shopkeeper-dashboard", "/inventory"];
  const shouldShowNavbar = user && !hideNavbarOn.includes(location.pathname);

  return (
    <div className="app-container">
      {/* If current path is NOT in hideNavbarOn, show it */}
      {shouldShowNavbar && <Navbar user={user} onLogout={handleLogout} />}
      
      <Routes>
        <Route 
    path="/" 
    element={!user ? <Login setUser={setUser} /> : <Navigate to="/student-dashboard" />} 
  />
        <Route path="/register" element={<Register />} />

        <Route path="/student-dashboard" element={user ? <StudentDashboard /> : <Navigate to="/" />} />
        <Route path="/my-orders" element={user ? <MyOrders /> : <Navigate to="/" />} />
        <Route path="/printing-page" element={user ? <PrintingPage /> : <Navigate to="/" />} />
        <Route path="/cart" element={user ? <Cart /> : <Navigate to="/" />} />
        
        <Route path="/shopkeeper-dashboard" element={user ? <ShopkeeperDashboard /> : <Navigate to="/" />} />
        <Route path="/inventory" element={user ? <InventoryPage /> : <Navigate to="/" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;