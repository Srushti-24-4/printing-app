// ✅ ALL imports at TOP
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import ShopkeeperDashboard from "./pages/ShopkeeperDashboard";
import MyOrders from "./pages/MyOrders";
import PrintingPage from "./pages/PrintingPage";

import InventoryPage from "./pages/InventoryPage";
import Cart from "./pages/Cart";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/shopkeeper-dashboard" element={<ShopkeeperDashboard />} />
      <Route path="/register" element={<Register />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/printing-page" element={<PrintingPage />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/inventory" element={<InventoryPage />} />
    </Routes>
  );
}

export default App;
