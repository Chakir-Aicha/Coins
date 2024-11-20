// pages/api/logPrice.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { price, movingAverage7, movingAverage30, rsi, timestamp } = req.body;

    if (typeof price !== 'number' || typeof movingAverage7 !== 'number' || typeof movingAverage30 !== 'number' || typeof rsi !== 'number') {
      return res.status(400).json({ error: 'Invalid data: Price, moving averages, and RSI must be provided as numbers' });
    }

    const csvFilePath = path.join(process.cwd(), 'data', 'bitcoin_prices.csv');
    
    const formattedTimestamp = new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19);

    const csvLine = `${formattedTimestamp},${price.toFixed(2)},${movingAverage7.toFixed(2)},${movingAverage30.toFixed(2)},${rsi.toFixed(2)}\n`;

    if (!fs.existsSync(path.dirname(csvFilePath))) {
      fs.mkdirSync(path.dirname(csvFilePath), { recursive: true });
    }

    fs.appendFileSync(csvFilePath, csvLine);

    return res.status(200).json({ message: 'Price and indicators logged successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

