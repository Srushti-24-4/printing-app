from flask import Flask
from models import db
from flask_migrate import Migrate

app = Flask(__name__)

# REPLACE 'your_password' with your actual MySQL Workbench password
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:123456@localhost/stationary_system'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def home():
    return "<h1>Stationary System Backend is Running!</h1>"

if __name__ == '__main__':
    app.run(debug=True)