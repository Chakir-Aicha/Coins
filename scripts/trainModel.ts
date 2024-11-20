// scripts/trainModel.ts
import fs from 'fs';
import path from 'path';

interface TrainingData {
  timestamp: string;
  price: number;
  movingAverage7: number;
  movingAverage30: number;
  rsi: number;
}

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

function trainModel(data: TrainingData[]) {
  console.log('Training model with data:', data);
  return { model: 'trainedModel' }; 
}

function trainAndSaveModel() {
  const data = loadTrainingData();
  const model = trainModel(data);

  const modelPath = path.join(process.cwd(), 'data', 'trained_model.json');
  fs.writeFileSync(modelPath, JSON.stringify(model));
  console.log('Model trained and saved successfully.');
}

trainAndSaveModel();
