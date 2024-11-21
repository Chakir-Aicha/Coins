from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import signal
from model import predict as model_predict, train_model  # Renaming the import



app = Flask(__name__)
CORS(app)  

@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.get_json()
        print(f"Received data: {input_data}")

        if input_data is None:
            return jsonify({'error': 'No input data provided'}), 400

        # Extract required fields
        moving_average_7 = input_data.get('movingAverage7')
        moving_average_30 = input_data.get('movingAverage30')
        rsi = input_data.get('rsi')

        if not all([moving_average_7, moving_average_30, rsi]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Predict the next price using the model
        input_features = [moving_average_7, moving_average_30, rsi]  # The last two are placeholders

        # Predict the next price using the model
        prediction = model_predict(input_features)        
        print(f"Prediction: {prediction}")
        return jsonify({'prediction': prediction}), 200

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/train', methods=['POST'])
def retrain_model():
    try:
        print("Retraining model...")
        train_model()  
        print("Model retrained successfully.")
        return jsonify({'message': 'Model retrained successfully'}), 200
    except Exception as e:
        print(f"Error during retraining: {e}")
        return jsonify({'error': str(e)}), 500




def graceful_shutdown(sig, frame):
    print("Shutting down gracefully...")
    sys.exit(0)

if __name__ == '__main__':
    if not os.path.exists('bitcoin_model.pkl'):
        train_model()  # Train model if it doesn't exist

    signal.signal(signal.SIGINT, graceful_shutdown)  # Handle graceful shutdown on Ctrl+C
    app.run(debug=True)

