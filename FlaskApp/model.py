import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import joblib
import os

def load_data():
    # Adjust the file path to ensure it works regardless of script location
    file_path = os.path.join(os.path.dirname(__file__), '..', 'Coins', 'data', 'bitcoin_prices.csv')
    
    # Read the data
    try:
        data = pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"Error: The file {file_path} was not found.")
        raise
    
    # Ensure timestamp column exists and parse it
    if 'timestamp' not in data.columns:
        raise ValueError("Data must contain a 'timestamp' column.")
    
    data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')  # Handle invalid date entries
    data.set_index('timestamp', inplace=True)

    # Check for the necessary columns before proceeding
    required_columns = ['movingAverage7', 'movingAverage30', 'rsi', 'price']
    missing_columns = [col for col in required_columns if col not in data.columns]
    
    if missing_columns:
        raise ValueError(f"Missing columns in the data: {', '.join(missing_columns)}")

    return data

def train_model():
    data = load_data()
    
    # Define features and target
    features = data[['movingAverage7', 'movingAverage30', 'rsi']].dropna()  # Handle missing values
    target = data['price'].dropna()  # Handle missing values
    
    # Ensure that features and target have the same length after dropping NaN
    if len(features) != len(target):
        print("Warning: Features and target have mismatched lengths after removing missing values.")
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)
    
    # Initialize and train the model
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Save the model
    model_path = 'bitcoin_model.pkl'
    joblib.dump(model, model_path)
    print(f"Model trained and saved as '{model_path}'")

def predict(input_data):
    try:
        model = joblib.load('bitcoin_model.pkl')
    except FileNotFoundError:
        print("Error: Model file 'bitcoin_model.pkl' not found.")
        raise
    
    # Ensure input_data is in the correct format (a list or array)
    if not isinstance(input_data, (list, tuple)):
        raise ValueError("Input data must be a list or tuple of feature values.")
    
    # Reshape input if necessary (e.g., if input_data is a single row)
    input_data = [input_data] if isinstance(input_data, list) else input_data
    
    # Make prediction
    prediction = model.predict(input_data)
    
    return prediction[0]

# Example usage:
# train_model()  # Uncomment to train the model
# input_data = [88899.00, 91529.99, 88694.68]  # Example input
# prediction = predict(input_data)
# print(f"Prediction: {prediction}")
