from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import signal
from model import predict as model_predict, train_model  
import google.generativeai as genai
import json

app = Flask(__name__)
CORS(app)  
genai.configure(api_key="AIzaSyDeqBGzcDBaiiQpG11pFjebvKVLPHbAk2I")
@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.get_json()

        if input_data is None:
            return jsonify({'error': 'No input data provided'}), 400

        moving_average_7 = input_data.get('movingAverage7')
        moving_average_30 = input_data.get('movingAverage30')
        rsi = input_data.get('rsi')

        if not all([moving_average_7, moving_average_30, rsi]):
            return jsonify({'error': 'Missing required fields'}), 400

        input_features = [moving_average_7, moving_average_30, rsi]  

        prediction = model_predict(input_features)        
        return jsonify({'prediction': prediction}), 200

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/gemini-advice', methods=['POST'])
def gemini_advice():
    try:
        # Récupérer les données de la requête
        input_data = request.get_json()

        if input_data is None or 'price' not in input_data:
            return jsonify({'error': 'Bitcoin price is required'}), 400

        bitcoin_price = input_data['price']

        # Créer le prompt pour Gemini
        prompt = f"""
        Le prix actuel du Bitcoin est de {bitcoin_price} USD. 
        Fournissez une recommandation basée sur ce prix. 
        Répondez de manière concise, par exemple : 
        "C'est le moment d'investir." ou "Attendez une meilleure opportunité" ou donner message personnalisé 
        """

        # Envoyer le prompt à Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)

        # Retourner la réponse
        return jsonify({
            'bitcoin_price': bitcoin_price,
            'advice': response.text.strip()  # Nettoyer la réponse
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/analyse', methods=['GET'])
def analyse():
    file_path = './comments.json'  # Remplacez par le chemin réel du fichier JSON

    # Lire les commentaires depuis le fichier JSON
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"Data loaded: {data}")  # Ajouter pour vérifier le format des données
        comments = [comment['comment'] for comment in data if 'comment' in comment]

        print("comment  {comments[:3]}")
    except Exception as e:
        return jsonify({"error": "Unable to read the file. Please check the file path and format.", "details": str(e)}), 400

    if not comments:
        return jsonify({"error": "No comments found in the file."}), 400
    prompt = f"""
    Analyze the following comments on Bitcoin, and provide the probabilities (in percentage) that the price of Bitcoin will increase or decrease in the next 5 minutes based on sentiment and trends. Comments:
    {comments}

    Respond only with the following JSON:
    {{
      "increase_probability": 0-100,
      "decrease_probability": 0-100
    }}
    """
    try:
        # Envoyer le prompt à Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Retourner la réponse au format JSON
        return jsonify({'response': response.text})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
@app.route('/train', methods=['POST'])
def retrain_model():
    try:
        train_model()  
        return jsonify({'message': 'Model retrained successfully'}), 200
    except Exception as e:
        print(f"Error during retraining: {e}")
        return jsonify({'error': str(e)}), 500




def graceful_shutdown(sig, frame):
    sys.exit(0)

if __name__ == '__main__':
    if not os.path.exists('bitcoin_model.pkl'):
        train_model()  

    signal.signal(signal.SIGINT, graceful_shutdown)  
    app.run(debug=True)