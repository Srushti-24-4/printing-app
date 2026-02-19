import "./StudentDashboard.css";

const products = [
  { name: "Black Pen", price: 10, image: "/images/black-pen.jpg" },
  { name: "Blue Pen", price: 10, image: "/images/blue-pen.jpg" },
  { name: "Single Side Ruled Pages", price: 50, image: "/images/single-side.jpeg" },
  { name: "Double Side Ruled Pages", price: 60, image: "/images/double-side.jpeg" },
  { name: "Transparent Folder", price: 25, image: "/images/folder.png" },
  { name: "Transparent File", price: 30, image: "/images/t-file.jpg" },
  { name: "Submission File", price: 40, image: "" },
  { name: "Eraser", price: 5, image: "/images/eraser.jpg" },
  { name: "Transparent Scale", price: 15, image: "/images/t-scale.jpg" },
  { name: "Steel Scale", price: 20, image: "/images/s-scale.jpg" },
];

function StudentDashboard() {
  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <div className="navbar">
        <h2>Campus Stationery</h2>
        <div className="nav-links">
          <span className="active">Products</span>
          <span>Printing</span>
          <span>My Orders</span>
          <span>🛒</span>
          <span>👤</span>
        </div>
      </div>

      {/* Banner */}
      <div className="banner">
        <h1>Welcome to Campus Stationery!</h1>
        <p>Get all your college essentials at your fingertips</p>
      </div>

      {/* Products */}
      <h2 className="section-title">All Products</h2>

      <div className="product-grid">
        {products.map((item) => (
          <div className="product-card" key={item.id}>
            <img src={item.image} alt={item.name} />
            <div className="product-info">
              <h3>{item.name}</h3>
              <p className="price">₹{item.price}</p>
              <button>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentDashboard;