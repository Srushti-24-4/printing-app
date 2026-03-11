import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import ShopkeeperDashboard from "./pages/ShopkeeperDashboard";
import MyOrders from "./pages/MyOrders";
import Inventory from "./pages/Inventory";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/shopkeeper-dashboard" element={<ShopkeeperDashboard />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/inventory" element={<Inventory />} />
    </Routes>
  );
}

export default App;
