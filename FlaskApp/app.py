from flask import Flask, request, jsonify
from apscheduler.schedulers.background import BackgroundScheduler
from model import predict, train_model
import joblib
import os
import signal
import sys
from flask_cors import CORS  # Import CORS


app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Initialize scheduler
scheduler = BackgroundScheduler()

# Function to retrain the model
def scheduled_train():
    print("Training model...")
    train_model()
    print("Model retrained.")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.get_json()
        print(f"Received data: {input_data}")  # Log received data

        if input_data is None:
            return jsonify({'error': 'No input data provided'}), 400

        moving_average_7 = input_data.get('movingAverage7')
        moving_average_30 = input_data.get('movingAverage30')
        rsi = input_data.get('rsi')

        if not all([moving_average_7, moving_average_30, rsi]):
            return jsonify({'error': 'Missing required fields'}), 400

        prediction = some_prediction_function(moving_average_7, moving_average_30, rsi)

        print(prediction)
        return jsonify({'prediction': prediction})

    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/train', methods=['POST'])
def retrain_model():
    train_model()
    return jsonify({'message': 'Model retrained successfully'}), 200

# Graceful shutdown handler
def shutdown_scheduler():
    print("Shutting down scheduler...")
    scheduler.shutdown()

# Register shutdown handler to stop scheduler on app exit
signal.signal(signal.SIGINT, lambda signum, frame: shutdown_scheduler())

if __name__ == '__main__':
    # Ensure the model is available
    if not os.path.exists('bitcoin_model.pkl'):
        train_model()  # Train model if not already trained

    # Set up the scheduler to run the retraining every hour
    scheduler.add_job(scheduled_train, 'interval', hours=1)
    scheduler.start()

    # Run the Flask app
    try:
        app.run(debug=True)
    except KeyboardInterrupt:
        shutdown_scheduler()
