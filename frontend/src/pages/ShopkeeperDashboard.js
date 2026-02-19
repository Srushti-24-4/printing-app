import "./ShopkeeperDashboard.css";

function ShopkeeperDashboard() {
  return (
    <div className="shop-container">
      {/* Navbar */}
      <div className="shop-navbar">
        <h2>Shopkeeper Dashboard</h2>
        <div className="nav-links">
          <span className="active">Orders Queue</span>
          <span>Inventory</span>
          <span>abc</span>
        </div>
      </div>

      {/* Header */}
      <div className="shop-header">
        <h1>Orders Queue</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p>Pending Orders</p>
          <h2>0</h2>
          <span>Awaiting fulfillment</span>
        </div>

        <div className="stat-card">
          <p>Completed Today</p>
          <h2>0</h2>
          <span>Successfully fulfilled</span>
        </div>

        <div className="stat-card">
          <p>Total Revenue</p>
          <h2>₹0</h2>
          <span>All time</span>
        </div>
      </div>

      {/* Pending Orders */}
      <h2 className="section-title">Pending Orders (0)</h2>

      <div className="pending-box">
        <div className="empty-state">
          <div className="check">✔</div>
          <p>All caught up!</p>
          <span>No pending orders at the moment</span>
        </div>
      </div>

      {/* Completed Orders (empty for now) */}
      <h2 className="section-title">Recently Completed</h2>
      <div className="completed-list">
        {/* Will be filled dynamically later */}
      </div>
    </div>
  );
}

export default ShopkeeperDashboard;