from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# 1. User Table (The Student/Admin)
class User(db.Model):
    __tablename__ = 'Users'
    user_id = db.Column(db.Integer, primary_key=True)
    moodle_id = db.Column(db.String(8), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('Student', 'Admin'), default='Student')
    # Relationship to find all orders for a user
    orders = db.relationship('Order', backref='student', lazy=True)

# 2. Stationery Items (Pens, Notebooks, etc.)
class Item(db.Model):
    __tablename__ = 'Items'
    item_id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    price_per_unit = db.Column(db.Float, nullable=False) # Changed to Float for easier calc
    stock_qty = db.Column(db.Integer, default=0)

# 3. The Parent Order (The "Bundle")
class Order(db.Model):
    __tablename__ = 'Orders'
    order_id = db.Column(db.Integer, primary_key=True)
    # Reference User table's user_id
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    order_token = db.Column(db.String(10), unique=True, nullable=False)
    total_price = db.Column(db.Float, default=0.00)
    status = db.Column(db.Enum('Pending', 'Processing', 'Done', 'Collected', 'Cancelled'), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships to get all children of this order
    details = db.relationship('OrderDetail', backref='parent_order', cascade="all, delete-orphan")
    prints = db.relationship('PrintRequest', backref='parent_order', cascade="all, delete-orphan")
    ready_at = db.Column(db.DateTime, nullable=True)

# 4. Stationery Order Details (Linked to Order)
class OrderDetail(db.Model):
    __tablename__ = 'Order_Details'
    detail_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('Items.item_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)

# 5. Print Requests (Linked to Order)
class PrintRequest(db.Model):
    __tablename__ = 'Print_Requests'
    print_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    page_count = db.Column(db.Integer, nullable=False)
    copies = db.Column(db.Integer, default=1)
    is_color = db.Column(db.Boolean, default=False)
    print_price = db.Column(db.Float, default=0.00)