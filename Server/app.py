from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB connection
client = MongoClient("mongodb+srv://piyushkumar26november:dpProjectPassword@dpcluster.qhzp2.mongodb.net/?retryWrites=true&w=majority&appName=dpcluster")
db = client["DP-Project"]

# Collections
raw_data_collection = db["raw_data"]
processed_data_collection = db["processed_data"]

@app.route('/')
def home():
    return "Flask server is running!"

#receive data and ml model will be called
@app.route('/data', methods=['POST'])
def receive_data():
    try:
        # Parse data from request
        data = request.json
        unique_id = data.get("uniqueId")
        raw_data = data.get("data")
 
        if not unique_id or not raw_data:
            return jsonify({"error": "Missing uniqueId or data"}), 400

        # Save raw data in MongoDB
        raw_data_doc = {
            "uniqueId": unique_id,
            "data": raw_data,
            "timestamp": datetime.utcnow()
        }
        raw_data_collection.insert_one(raw_data_doc)

        # Mock ML model prediction
        prediction = sum(raw_data.values())  # Replace with your actual ML logic

        # Save processed data in MongoDB
        processed_data_doc = {
            "uniqueId": unique_id,
            "result": {"prediction": prediction},
            "timestamp": datetime.utcnow()
        }
        processed_data_collection.insert_one(processed_data_doc) 

        return jsonify({"status": "success", "prediction": prediction}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
  
# jab app reuest maregi toh yr chlega 
@app.route('/result', methods=['GET'])
def get_result():
    try:
        # Extract uniqueId from request
        unique_id = request.args.get("uniqueId")

        if not unique_id:
            return jsonify({"error": "Missing uniqueId"}), 400  

        # Find the latest processed data for the uniqueId
        latest_result = processed_data_collection.find_one(
            {"uniqueId": unique_id},
            sort=[("timestamp", -1)]  # Sort by timestamp in descending order
        )

        if not latest_result:
            return jsonify({"error": "No result found for this uniqueId"}), 404
        
        # Convert ObjectId to string
        latest_result["_id"] = str(latest_result["_id"])

        return jsonify(latest_result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if(__name__ == '__main__'):
    # app.run(debug=True)
    app.run(debug=False, host='0.0.0.0')