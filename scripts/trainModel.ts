import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs';

interface TrainingData {
  timestamp: string;
  price: number;
  movingAverage7: number;
  movingAverage30: number;
  rsi: number;
}

// Charger les données depuis le fichier CSV
function loadTrainingData(): TrainingData[] {
  const csvFilePath = path.join(process.cwd(), 'data', 'bitcoin_prices.csv');
  const data = fs.readFileSync(csvFilePath, 'utf-8').split('\n').slice(1); // Skip header if present

  const parsedData = data.map((line) => {
    const [timestamp, price, movingAverage7, movingAverage30, rsi] = line.split(',');
    return {
      timestamp,
      price: parseFloat(price),
      movingAverage7: parseFloat(movingAverage7),
      movingAverage30: parseFloat(movingAverage30),
      rsi: parseFloat(rsi),
    } as TrainingData;
  });

  return parsedData.filter((item) => !isNaN(item.price));
}

// Préparer les données pour l'entraînement des deux modèles
function prepareData(data: TrainingData[]) {  // Modification ici pour accepter un tableau
  const inputs = data.map((item) => [
    item.movingAverage7,
    item.movingAverage30,
    item.rsi,
  ]);
  const outputs = data.map((item) => item.price);

  // Convertir les données en tenseurs
  const inputTensor = tf.tensor2d(inputs);
  const outputTensor = tf.tensor2d(outputs, [outputs.length, 1]);

  return { inputTensor, outputTensor };
}

// Entraîner le modèle de deep learning
async function trainDeepLearningModel(data: TrainingData[]) {
  console.log('Training deep learning model...');

  const { inputTensor, outputTensor } = prepareData(data);

  // Créer le modèle de deep learning avec TensorFlow.js
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [3] }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError',
  });

  // Entraîner le modèle
  await model.fit(inputTensor, outputTensor, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2, // Séparer 20% des données pour la validation
  });

  console.log('Deep learning model trained successfully.');
  return model;
}

// Entraîner un modèle de régression simple (exemple avec un modèle linéaire)
function trainRegressionModel(data: TrainingData[]) {  // Modification ici pour accepter un tableau
  console.log('Training regression model...');

  const { inputTensor, outputTensor } = prepareData(data);

  // Entraînement du modèle de régression (ici une régression linéaire simple comme exemple)
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [3] }));

  model.compile({
    optimizer: 'sgd', // Utilisation de la descente de gradient stochastique
    loss: 'meanSquaredError',
  });

  model.fit(inputTensor, outputTensor, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
  }).then(() => {
    console.log('Regression model trained successfully.');
  });

  return model;
}

// Entraîner et sauvegarder les deux modèles
async function trainAndSaveModels() {
  const data = loadTrainingData();

  // Entraînement des deux modèles
  const deepLearningModel = await trainDeepLearningModel(data);
  const regressionModel = trainRegressionModel(data);

  // Sauvegarde des modèles
  const deepLearningModelPath = path.join(process.cwd(), 'data', 'trained_deep_learning_model.json');
  await deepLearningModel.save(`file://${deepLearningModelPath}`);
  console.log('Deep learning model saved.');

  const regressionModelPath = path.join(process.cwd(), 'data', 'trained_regression_model.json');
  await regressionModel.save(`file://${regressionModelPath}`);
  console.log('Regression model saved.');
}

// Appel de la fonction principale pour entraîner et sauvegarder les modèles
trainAndSaveModels();
