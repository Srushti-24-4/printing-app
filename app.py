import pymysql
pymysql.install_as_MySQLdb()
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from pypdf import PdfReader
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
CORS(app)

# --- Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:test1234@127.0.0.1:3306/stationary_system'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
db = SQLAlchemy(app)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
def get_ist_time():
    # UTC + 5:30
    return datetime.utcnow() + timedelta(hours=5, minutes=30)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Models ---
class User(db.Model):
    __tablename__ = 'Users'
    user_id = db.Column(db.Integer, primary_key=True)
    moodle_id = db.Column(db.String(8), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('Student', 'Admin'), default='Student')

class Item(db.Model):
    __tablename__ = 'Items'
    item_id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    price_per_unit = db.Column(db.Float, nullable=False)
    stock_qty = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255), nullable=True)

class Order(db.Model):
    __tablename__ = 'Orders'
    order_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    order_token = db.Column(db.String(20), nullable=False) 
    total_price = db.Column(db.Float, default=0.0)
    status = db.Column(db.Enum('Pending', 'Processing', 'Done', 'Collected', 'Cancelled'), default='Pending')
    
    # This is the line that fixes your Daily Sales!
    created_at = db.Column(db.DateTime, default=get_ist_time)
    
    ready_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    print_requests = db.relationship('PrintRequest', backref='order', lazy=True, cascade="all, delete-orphan")
    stationery_items = db.relationship('OrderDetail', backref='order', lazy=True, cascade="all, delete-orphan")
class PrintRequest(db.Model):
    __tablename__ = 'Print_Requests'
    print_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    copies = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)

class OrderDetail(db.Model):
    __tablename__ = 'Order_Details'
    detail_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('Items.item_id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    subtotal = db.Column(db.Float, nullable=False)

# --- Utilities ---
def seed_inventory():
    if Item.query.first() is None:
        items = [
            Item(item_name="Black Pen", price_per_unit=10.0, category="Writing", stock_qty=50),
            Item(item_name="Blue Pen", price_per_unit=10.0, category="Writing", stock_qty=50),
            Item(item_name="Ruled Pages", price_per_unit=50.0, category="Paper", stock_qty=100)
        ]
        db.session.bulk_save_objects(items)
        if User.query.filter_by(moodle_id="24102003").first() is None:
            test_user = User(
                moodle_id="24102003", 
                name="Test Student", 
                email="test@student.com", 
                password=generate_password_hash("password123"),
                role="Student"
            )
            db.session.add(test_user)
        db.session.commit()

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# --- Routes ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    try:
        # Check if user already exists
        if User.query.filter_by(moodle_id=data.get('moodle_id')).first():
            return jsonify({"error": "Moodle ID already registered"}), 400
        
        new_user = User(
            moodle_id=data.get('moodle_id'),
            name=data.get('name'),
            email=data.get('email'),
            password=generate_password_hash(data.get('password')),
            role=data.get('role', 'Student') # Defaults to Student
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    try:
        user = User.query.filter_by(moodle_id=data.get('moodle_id')).first()
        
        if user and check_password_hash(user.password, data.get('password')):
            return jsonify({
                "message": "Login successful",
                "user": {
                    "moodle_id": user.moodle_id,
                    "name": user.name,
                    "role": user.role
                }
            }), 200
        else:
            return jsonify({"error": "Invalid Moodle ID or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/items', methods=['GET'])
def get_items():
    items = Item.query.all()
    return jsonify([{
        "id": i.item_id,
        "name": i.item_name,
        "price": i.price_per_unit,
        "category": i.category,
        "stock": i.stock_qty,
        "image": i.image_url
    } for i in items]), 200
from datetime import datetime

from datetime import datetime, time

@app.route('/api/admin/sales-stats', methods=['GET'])
def get_sales_stats():
    try:
        # Get 'Today' in IST
        ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        ist_today = ist_now.date()
        
        # Filter orders where the date matches IST today
        daily_orders = Order.query.filter(
            db.func.date(Order.created_at) == ist_today,
            Order.status != 'Cancelled'
        ).all()
        
        daily_revenue = sum(order.total_price for order in daily_orders)
        
        # Lifetime Revenue
        total_orders_list = Order.query.filter(Order.status != 'Cancelled').all()
        total_revenue = sum(order.total_price for order in total_orders_list)
        
        return jsonify({
            "daily_revenue": round(daily_revenue, 2),
            "total_revenue": round(total_revenue, 2),
            "order_count": len(daily_orders)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/admin/orders', methods=['GET'])
def admin_orders():
    orders = Order.query.filter(Order.status != 'Collected').order_by(Order.created_at.desc()).all()
    return jsonify([{
        "id": o.order_id,
        "moodle_id": User.query.get(o.user_id).moodle_id,
        "status": o.status,
        "total": o.total_price,
        "ready_at": o.ready_at.isoformat() if o.ready_at else None,
        "items": [{"name": Item.query.get(i.item_id).item_name, "qty": i.quantity} for i in o.stationery_items],
        "prints": [{"file": p.filename, "copies": p.copies} for p in o.print_requests]
    } for o in orders]), 200

@app.route('/api/admin/inventory/delete/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        item = Item.query.get(item_id)
        if not item:
            return jsonify({"error": "Item not found"}), 404

        # 1. Manually remove references in Order_Details
        OrderDetail.query.filter_by(item_id=item_id).delete()
        
        # 2. Now you can safely delete the item
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({"message": "Item deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@app.route('/api/order', methods=['POST'])
def place_order():
    try:
        moodle_id = request.form.get('moodle_id')
        user = User.query.filter_by(moodle_id=moodle_id).first()
        if not user: return jsonify({"error": "User not found"}), 404

        active_order = Order.query.filter(Order.user_id == user.user_id, Order.status != 'Collected').first()
        if not active_order:
            active_order = Order(user_id=user.user_id, order_token=moodle_id)
            db.session.add(active_order)
            db.session.flush()

        # Handle Print Requests (Pages/Price)
        if 'file' in request.files:
            file = request.files['file']
            copies = int(request.form.get('copies', 1))
            path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(path)
            pages = len(PdfReader(path).pages)
            price = (pages * 2.0) * copies
            db.session.add(PrintRequest(order_id=active_order.order_id, filename=file.filename, pages=pages, copies=copies, price=price))
            active_order.total_price += price

        # --- UPDATED: Stationery Items & Stock Reduction ---
        item_name = request.form.get('item_name')
        if item_name:
            item = Item.query.filter_by(item_name=item_name).first()
            if item:
                qty = int(request.form.get('item_qty', 1))
                
                # Check if enough stock is available
                if item.stock_qty >= qty:
                    # SUBTRACT from inventory
                    item.stock_qty -= qty 
                    
                    subtotal = item.price_per_unit * qty
                    db.session.add(OrderDetail(
                        order_id=active_order.order_id, 
                        item_id=item.item_id, 
                        quantity=qty, 
                        subtotal=subtotal
                    ))
                    active_order.total_price += subtotal
                else:
                    return jsonify({"error": f"Only {item.stock_qty} units of {item.item_name} left in stock!"}), 400
            else:
                return jsonify({"error": "Item not found in inventory"}), 404

        db.session.commit()
        return jsonify({"token": active_order.order_token, "total": active_order.total_price}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/admin/inventory/add', methods=['POST'])
def add_item():
    try:
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = file.filename
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_path = filename

        new_item = Item(
            item_name=request.form.get('name'),
            price_per_unit=float(request.form.get('price')),
            category=request.form.get('category'),
            stock_qty=int(request.form.get('stock')),
            image_url=image_path 
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({"message": "Item added successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/update-status', methods=['POST'])
def update_status():
    data = request.json
    try:
        order = Order.query.get(data.get('order_id'))
        if order:
            new_status = data.get('status')
            order.status = new_status
            if new_status == 'Done':
                # Use plain local time
                order.ready_at = datetime.now() 
            db.session.commit()
            return jsonify({"message": "Status updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/user/orders/<moodle_id>', methods=['GET'])
def get_user_orders(moodle_id):
    user = User.query.filter_by(moodle_id=moodle_id).first()
    if not user: return jsonify([]), 200
    orders = Order.query.filter(Order.user_id == user.user_id, Order.status != 'Collected').all()
    return jsonify([{
        "id": o.order_id, 
        "token": o.order_token, 
        "status": o.status, 
        "total_price": o.total_price,
        "ready_at": o.ready_at.isoformat() if o.ready_at else None,
        "prints": [{"file": p.filename, "qty": p.copies} for p in o.print_requests],
        "items": [{"name": Item.query.get(i.item_id).item_name, "qty": i.quantity} for i in o.stationery_items]
    } for o in orders]), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_inventory()
    app.run(debug=True, port=5000)