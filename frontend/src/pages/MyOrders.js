import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MyOrders.css";

// --- Helper Function ---
const getCountdown = (readyAt) => {
  if (!readyAt) return null;
  
  // Convert T to space to ensure local time parsing
  const dateString = readyAt.replace('T', ' ');
  const readyTime = new Date(dateString);
  const expiryTime = new Date(readyTime.getTime() + (2 * 60 * 60 * 1000)); 
  const now = new Date();
  const diff = expiryTime - now;

  if (diff <= 0) return { text: "EXPIRED", urgent: true };

  const totalSeconds = Math.floor(diff / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return { 
    text: `${mins}m ${secs.toString().padStart(2, '0')}s left`, 
    urgent: mins < 15 
  };
};

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [renderTrigger, setRenderTrigger] = useState(0); // Forces re-render for the seconds clock
  const API_BASE_URL = "http://127.0.0.1:5000";

  const fetchMyOrders = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/orders/${user.moodle_id}`);
      const data = await response.json();
      setOrders(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    // Refresh data from server every 3s
    const dataInterval = setInterval(fetchMyOrders, 3000);
    // Refresh the UI every 1s so the timer counts down smoothly
    const timerInterval = setInterval(() => setRenderTrigger(t => t + 1), 1000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(timerInterval);
    };
  }, []);

  return (
    <div className="orders-container">
      <div className="navbar">
        <h2>Campus Store</h2>
        <div className="nav-links">
          <Link to="/student-dashboard">Products</Link>
          <Link to="/printing-page">Printing</Link>
          <Link to="/my-orders" className="active">My Orders</Link>
          <Link to="/cart">🛒</Link>
        </div>
      </div>

      <div className="orders-content">
        <h1>Your Active Tokens</h1>
        {orders.length === 0 ? (
          <p>No active orders. Start shopping!</p>
        ) : (
          orders.map((order) => {
            const countdown = getCountdown(order.ready_at);
            
            return (
              <div key={order.id} className={`order-card ${order.status === 'Done' ? 'ready-card' : ''}`}>
                <div className="order-header">
                  <h3>Token: #{order.token}</h3>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                <div className="order-body">
                  {/* Countdown Timer Logic */}
                  {order.status === "Done" && countdown && (
                    <div className={`student-timer ${countdown.urgent ? 'urgent' : ''}`}>
                      🕒 <strong>Please collect within: {countdown.text}</strong>
                    </div>
                  )}

                  {/* Print Jobs */}
                  {order.prints.length > 0 && (
                    <div className="item-group">
                      <strong>Documents:</strong>
                      {order.prints.map((p, i) => (
                        <p key={i}>📄 {p.file} (x{p.qty})</p>
                      ))}
                    </div>
                  )}

                  {/* Stationery Items */}
                  {order.items.length > 0 && (
                    <div className="item-group">
                      <strong>Stationery:</strong>
                      {order.items.map((item, i) => (
                        <p key={i}>✏️ {item.name} (x{item.qty})</p>
                      ))}
                    </div>
                  )}
                  
                  <hr />
                  <div className="total-row">
                    <span>Final Bill:</span>
                    <strong>₹{order.total_price.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MyOrders;