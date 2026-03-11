import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import ShopkeeperDashboard from "./pages/ShopkeeperDashboard";
import MyOrders from "./pages/MyOrders";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/shopkeeper-dashboard" element={<ShopkeeperDashboard />} />
      <Route path="/my-orders" element={<MyOrders />} />
    </Routes>
  );
}

export default App;
