import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { prediction } = req.body;

    // Validate the input data
    if (typeof prediction !== 'number') {
      return res.status(400).json({ error: 'Invalid data: Prediction must be a number' });
    }

    // Define the CSV file path
    const csvFilePath = path.join(process.cwd(),'public','data', 'predictions.csv');

    // Get the current timestamp and add one minute (60 seconds)
    const oneMinuteAhead = new Date();
    oneMinuteAhead.setMinutes(oneMinuteAhead.getMinutes() + 1);

    // Format the timestamp for CSV storage
    const formattedTimestamp = oneMinuteAhead
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    // Create the CSV line
    const csvLine = `${formattedTimestamp},${prediction.toFixed(2)}\n`;

    // Ensure the directory exists
    if (!fs.existsSync(path.dirname(csvFilePath))) {
      fs.mkdirSync(path.dirname(csvFilePath), { recursive: true });
    }

    // Append the prediction data to the CSV file
    try {
      fs.appendFileSync(csvFilePath, csvLine);
      return res.status(200).json({ message: 'Prediction logged successfully' });
    } catch (error) {
      console.error('Error writing to predictions CSV:', error);
      return res.status(500).json({ error: 'Failed to log prediction data' });
    }
  } else {
    // Handle unsupported methods
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
