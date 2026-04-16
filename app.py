import pymysql
pymysql.install_as_MySQLdb()
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from pypdf import PdfReader
from datetime import datetime, timezone
import os

app = Flask(__name__)
CORS(app)

# --- Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:test1234@127.0.0.1:3306/stationary_system'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
db = SQLAlchemy(app)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

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
    status = db.Column(db.Enum('Pending', 'Processing', 'Done', 'Collected'), default='Pending')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ready_at = db.Column(db.DateTime, nullable=True)
    
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

        if 'file' in request.files:
            file = request.files['file']
            copies = int(request.form.get('copies', 1))
            path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(path)
            pages = len(PdfReader(path).pages)
            price = (pages * 2.0) * copies
            db.session.add(PrintRequest(order_id=active_order.order_id, filename=file.filename, pages=pages, copies=copies, price=price))
            active_order.total_price += price

        item_name = request.form.get('item_name')
        if item_name:
            item = Item.query.filter_by(item_name=item_name).first()
            if item:
                qty = int(request.form.get('item_qty', 1))
                subtotal = item.price_per_unit * qty
                db.session.add(OrderDetail(order_id=active_order.order_id, item_id=item.item_id, quantity=qty, subtotal=subtotal))
                active_order.total_price += subtotal

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