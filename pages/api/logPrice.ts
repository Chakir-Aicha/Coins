// pages/api/logPrice.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { price } = req.body;

    // Check that price is a number
    if (typeof price !== 'number') {
      return res.status(400).json({ error: 'Price must be a number' });
    }

    // Set up the file path
    const csvFilePath = path.join(process.cwd(), 'data', 'bitcoin_prices.csv');
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const csvLine = `${timestamp},${price}\n`;

    // Create 'data' folder if it doesn't exist
    if (!fs.existsSync(path.dirname(csvFilePath))) {
      fs.mkdirSync(path.dirname(csvFilePath), { recursive: true });
    }

    // Append the price to the CSV file
    fs.appendFileSync(csvFilePath, csvLine);
    return res.status(200).json({ message: 'Price logged successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
