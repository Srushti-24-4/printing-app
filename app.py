import pymysql
pymysql.install_as_MySQLdb()
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from pypdf import PdfReader
import os, uuid

app = Flask(__name__)
# Enable CORS for your React frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- 1. Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:test1234@127.0.0.1:3306/stationary_system'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
db = SQLAlchemy(app)

# --- 2. Database Models ---
class User(db.Model):
    __tablename__ = 'Users'
    user_id = db.Column(db.Integer, primary_key=True)
    moodle_id = db.Column(db.String(8), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('Student', 'Admin'), default='Student')

class Order(db.Model):
    __tablename__ = 'Orders'
    order_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    order_token = db.Column(db.String(10), unique=True, nullable=False)
    total_price = db.Column(db.Float, default=0.0)
    status = db.Column(db.Enum('Pending', 'Processing', 'Done', 'Collected'), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    print_requests = db.relationship('PrintRequest', backref='order', lazy=True)
    stationery_items = db.relationship('OrderDetail', backref='order', lazy=True)

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
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# --- 3. Authentication Routes ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    moodle_id = str(data.get('moodle_id', '')).strip()
    if not (moodle_id.isdigit() and len(moodle_id) == 8):
        return jsonify({"message": "Moodle ID must be 8 digits"}), 400
    
    if User.query.filter_by(moodle_id=moodle_id).first():
        return jsonify({"message": "User already exists"}), 409
    
    new_user = User(
        moodle_id=moodle_id,
        name=data.get('name'),
        email=data.get('email'),
        password=generate_password_hash(data.get('password')),
        role=data.get('role', 'Student')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Registration successful"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(moodle_id=data.get('moodle_id')).first()
    if user and check_password_hash(user.password, data.get('password')):
        return jsonify({
            "user": {
                "name": user.name, 
                "moodle_id": user.moodle_id, 
                "role": user.role
            }
        }), 200
    return jsonify({"error": "Invalid Moodle ID or Password"}), 401

# --- 4. Core Order Logic (Unified) ---
@app.route('/api/order', methods=['POST'])
def place_order():
    try:
        moodle_id = request.form.get('moodle_id')
        user = User.query.filter_by(moodle_id=moodle_id).first()
        if not user: return jsonify({"error": "User not found"}), 404

        # Link to existing Pending order or create new
        active_order = Order.query.filter_by(user_id=user.user_id, status='Pending').first()
        if not active_order:
            token = str(uuid.uuid4().hex[:6]).upper()
            active_order = Order(user_id=user.user_id, order_token=token)
            db.session.add(active_order)
            db.session.flush()

        # Handle Print File
        if 'file' in request.files:
            file = request.files['file']
            copies = int(request.form.get('copies', 1))
            path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(path)
            
            pages = len(PdfReader(path).pages)
            print_price = (pages * 2.0) * copies
            
            new_print = PrintRequest(
                order_id=active_order.order_id, filename=file.filename,
                pages=pages, copies=copies, price=print_price
            )
            db.session.add(new_print)
            active_order.total_price += print_price

        # Handle Stationery Item
        item_name = request.form.get('item_name')
        if item_name:
            price = float(request.form.get('item_price', 0))
            qty = int(request.form.get('item_qty', 1))
            new_item = OrderDetail(
                order_id=active_order.order_id, item_name=item_name,
                quantity=qty, price=price * qty
            )
            db.session.add(new_item)
            active_order.total_price += (price * qty)

        db.session.commit()
        return jsonify({"token": active_order.order_token, "total": active_order.total_price}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- 5. Fetch Routes (The "Golden Thread" for MyOrders) ---
@app.route('/api/user/orders/<moodle_id>', methods=['GET'])
def get_user_orders(moodle_id):
    user = User.query.filter_by(moodle_id=moodle_id).first()
    if not user: return jsonify([]), 200
    
    orders = Order.query.filter_by(user_id=user.user_id).order_by(Order.created_at.desc()).all()
    output = []
    for o in orders:
        prints = PrintRequest.query.filter_by(order_id=o.order_id).all()
        items = OrderDetail.query.filter_by(order_id=o.order_id).all()
        output.append({
            "id": o.order_id,
            "token": o.order_token,
            "status": o.status,
            "total_price": o.total_price,
            "file": prints[0].filename if prints else None, # Simplified for UI
            "items": [{"name": i.item_name, "qty": i.quantity, "price": i.price} for i in items]
        })
    return jsonify(output), 200

@app.route('/api/admin/orders', methods=['GET'])
def admin_get_all():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([{
        "id": o.order_id,
        "token": o.order_token,
        "status": o.status,
        "total": o.total_price,
        "moodle_id": User.query.get(o.user_id).moodle_id
    } for o in orders]), 200

@app.route('/api/admin/update-status', methods=['POST'])
def update_status():
    data = request.json
    order = Order.query.get(data.get('order_id'))
    if order:
        order.status = data.get('status')
        db.session.commit()
        return jsonify({"message": "Status updated"}), 200
    return jsonify({"error": "Order not found"}), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)