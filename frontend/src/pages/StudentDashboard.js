import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./StudentDashboard.css";

const products = [
  { id: 1, name: "Black Pen", price: 10, image: "/images/black-pen.jpg" },
  { id: 2, name: "Blue Pen", price: 10, image: "/images/blue-pen.jpg" },
  { id: 3, name: "Single Side Ruled Pages", price: 50, image: "/images/single-side.jpeg" },
  { id: 4, name: "Double Side Ruled Pages", price: 60, image: "/images/double-side.jpeg" },
  { id: 5, name: "Transparent Folder", price: 25, image: "/images/folder.png" },
  { id: 6, name: "Transparent File", price: 30, image: "/images/t-file.jpg" },
  { id: 7, name: "Submission File", price: 40, image: "" },
  { id: 8, name: "Eraser", price: 5, image: "/images/eraser.jpg" },
  { id: 9, name: "Transparent Scale", price: 15, image: "/images/t-scale.jpg" },
  { id: 10, name: "Steel Scale", price: 20, image: "/images/s-scale.jpg" },
];

// ✅ SUB-COMPONENT FOR BLINK EFFECT
function ProductCard({ item, addToCart }) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addToCart(item);
    setIsAdded(true);
    // Reset the "Added" state after 1 second
    setTimeout(() => setIsAdded(false), 500);
  };

  return (
    <div className="product-card" key={item.id}>
      <img src={item.image} alt={item.name} />
      <div className="product-info">
        <h3>{item.name}</h3>
        <p className="price">₹{item.price}</p>
        <button 
          onClick={handleAdd}
          className={isAdded ? "added-blink" : ""}
          style={{
            backgroundColor: isAdded ? "#28a745" : "", // Turns green on click
            transition: "all 0.3s ease"
          }}
        >
          {isAdded ? "Added! ✅" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { addToCart } = useCart();

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <div className="navbar">
        <h2>Campus Stationery</h2>
        <div className="nav-links">
          <Link to="/student-dashboard">
            <span className="active">Products</span>
          </Link>
          <Link to="/printing-page">
            <span>Printing</span>
          </Link>
          <Link to="/my-orders">
            <span>My Orders</span>
          </Link>
          <Link to="/cart">
            <span>🛒</span>
          </Link>
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
          <ProductCard 
            key={item.id} 
            item={item} 
            addToCart={addToCart} 
          />
        ))}
      </div>
    </div>
  );
}

export default StudentDashboard;