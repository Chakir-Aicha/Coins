from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import joblib
import os
import pandas as pd

def load_data():
    file_path = os.path.join(os.path.dirname(__file__), '..', 'public','data', 'bitcoin_prices.csv')
    
    try:
        data = pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"Error: The file {file_path} was not found.")
        raise
    
    data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')
    data.set_index('timestamp', inplace=True)
    
    required_columns = ['price','movingAverage7', 'movingAverage30', 'rsi']
    missing_columns = [col for col in required_columns if col not in data.columns]
    
    if missing_columns:
        raise ValueError(f"Missing columns in the data: {', '.join(missing_columns)}")

    # Handle missing values
    data = data.dropna(subset=['price','movingAverage7', 'movingAverage30', 'rsi'])
    
    return data

def train_model():
    data = load_data()
    
    # Create lag features or other time-based features if needed
    features = data[['movingAverage7', 'movingAverage30', 'rsi']]  
    target = data['price']  
    
    # Use TimeSeriesSplit or similar if needed
    X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, shuffle=False)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    model_path = 'bitcoin_model.pkl'
    joblib.dump(model, model_path)
    print(f"Model trained and saved as '{model_path}'")

def predict(input_data):
    try:
        model = joblib.load('bitcoin_model.pkl')
    except FileNotFoundError:
        print("Error: Model file 'bitcoin_model.pkl' not found.")
        raise
    
    if not isinstance(input_data, (list, tuple)):
        raise ValueError("Input data must be a list or tuple of feature values.")
    
    input_data = [input_data] if isinstance(input_data, list) else input_data
    
    # Ensure the input is a 2D array for prediction
    if len(input_data[0]) != 3:  # Check if the input has 3 features
        raise ValueError("Input data must contain 3 features (movingAverage7, movingAverage30, rsi).")
    print(input_data)
    prediction = model.predict(input_data)
    print(f"Predicted price: {prediction[0]}")
    
    return prediction[0]
