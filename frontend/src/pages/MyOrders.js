import "./MyOrders.css";

function MyOrders() {
  return (
    <div className="orders-container">

      {/* Navbar */}
      <div className="navbar">
        <h2 className="logo">Campus Stationery</h2>

        <div className="nav-links">
          <span>Products</span>
          <span>Printing</span>
          <span className="active">My Orders</span>
        </div>

        <div className="nav-icons">
          <span>🛒</span>
          <span>👤</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track your stationery and print orders</p>
      </div>

      {/* Empty Orders Box */}
      <div className="orders-box">
        <div className="empty-state">
          <div className="icon">📦</div>
          <h3>No orders yet</h3>
          <p>Start shopping to see your orders here</p>
        </div>
      </div>

    </div>
  );
}

export default MyOrders;