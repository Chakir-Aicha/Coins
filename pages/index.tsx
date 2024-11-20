import { useEffect, useState, useRef } from 'react';
import '../styles/globals.css';
import Chart from 'chart.js/auto';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  total_volume: number;
  market_cap: number;
}

interface HistoricalDataPoint {
  price: number;
  timestamp: number;
}

export default function Home() {
  const [coin, setCoin] = useState<Coin | null>(null);
  const [movingAverage7, setMovingAverage7] = useState<number[]>([]);
  const [movingAverage30, setMovingAverage30] = useState<number[]>([]);
  const [rsi, setRsi] = useState<number[]>([]);
  const [historicalPrices, setHistoricalPrices] = useState<HistoricalDataPoint[]>([]);
  const chartRef = useRef<Chart | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null); 
  const predictionChartRef = useRef<Chart | null>(null); 
  const coinId = 'bitcoin';

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function fetchCoin() {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&sparkline=false&nocache=${Date.now()}`
        );
        if (response.ok) {
          const data = await response.json();
          setCoin(data[0]);
        }
      } catch (error) {
        console.error('Error fetching coin data:', error);
      }
    }

    fetchCoin();
    intervalId = setInterval(fetchCoin, 60000); 

    return () => clearInterval(intervalId); 
  }, [coinId]);

  // useEffect(() => {
  //   if (coin && movingAverage7.length && movingAverage30.length && rsi.length) {
  //     initializeChart(coin.id);
  //     logPriceToServer(coin.current_price, coin.id, movingAverage7, movingAverage30, rsi);
      
  //     fetchPrediction(movingAverage7.slice(-1)[0], movingAverage30.slice(-1)[0], rsi.slice(-1)[0]);
  //   }
  // }, [coin, movingAverage7, movingAverage30, rsi]); 
  useEffect(() => {
    if (coin) {
      initializeChart(coin.id);
      if (movingAverage7.length && movingAverage30.length && rsi.length) {
        logPriceToServer(
          coin.current_price,
          coin.id,
          movingAverage7,
          movingAverage30,
          rsi
        ); 
        fetchPrediction(movingAverage7.slice(-1)[0], movingAverage30.slice(-1)[0], rsi.slice(-1)[0]);

      }
    }
  }, [coin]);

  async function fetchHistoricalDataForCoin(coinId: string): Promise<HistoricalDataPoint[]> {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/?vs_currency=usd&days=7`);
    if (!response.ok) throw new Error('Failed to fetch historical data');
    const historicalData: any = await response.json();

    return historicalData.prices.map((pricePoint: [number, number]) => ({
      timestamp: pricePoint[0],
      price: pricePoint[1],
    }));
  }

  function calculateMovingAverage(data: number[], period: number): number[] {
    return data.map((_, index, array) => {
      if (index < period) return null;
      const sum = array.slice(index - period, index).reduce((a, b) => a + b, 0);
      return sum / period;
    }).filter(item => item !== null) as number[];
  }

  function calculateRSI(data: number[], period = 14): number[] {
    let gains = 0;
    let losses = 0;
    const rsi = [];
    for (let i = 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      if (i < period) {
        if (diff >= 0) gains += diff;
        else losses -= diff;
      } else {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
        gains = avgGain;
        losses = avgLoss;
      }
    }
    return rsi;
  }
  async function fetchPrediction(ma7: number, ma30: number, rsiValue: number) {
    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movingAverage7: ma7, movingAverage30: ma30, rsi: rsiValue })
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setPrediction(data.prediction);
        updatePredictionChart(data.prediction); // Update prediction chart
      } else {
        console.error('Error fetching prediction:', response.statusText);
      }
    } catch (error) {
      console.error('Error in prediction API call:', error);
    }
  }
  function updatePredictionChart(prediction: number) {
    if (predictionChartRef.current) predictionChartRef.current.destroy();
    
    const ctx = document.getElementById(`prediction-chart`) as HTMLCanvasElement;
    predictionChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Prediction'],
        datasets: [
          {
            label: 'Predicted Price',
            data: [prediction],
            borderColor: 'purple',
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { display: true },
          y: { beginAtZero: false },
        },
      },
    });
  }

  async function initializeChart(coinId: string) {
    const historicalData = await fetchHistoricalDataForCoin(coinId);
    const labels = historicalData.map((dataPoint) => new Date(dataPoint.timestamp).toLocaleDateString());
    const data = historicalData.map((dataPoint) => dataPoint.price);

    const ma7 = calculateMovingAverage(data, 7);
    const ma30 = calculateMovingAverage(data, 30);
    const rsiData = calculateRSI(data);

    setMovingAverage7(ma7);
    setMovingAverage30(ma30);
    setRsi(rsiData);
    setHistoricalPrices(historicalData); 

    if (chartRef.current) chartRef.current.destroy();
    const ctx = document.getElementById(`chart-${coinId}`) as HTMLCanvasElement;
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Price Variation (7 Days)', data, borderColor: 'blue' },
          { label: '7-day Moving Avg', data: ma7, borderColor: 'green', borderDash: [5, 5] },
          { label: '30-day Moving Avg', data: ma30, borderColor: 'orange', borderDash: [5, 5] },
          { label: 'RSI', data: rsiData, borderColor: 'red', yAxisID: 'y1' },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { display: true },
          y: { beginAtZero: false },
          y1: { position: 'right', min: 0, max: 100, ticks: { callback: (value) => value + '%' } },
        },
      },
    });
  }

  function logPriceToServer(price: number, coinId: string, ma7: number[], ma30: number[], rsi: number[]) {
    fetch('/api/logPrice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coinId,
        price,
        timestamp: Date.now(),
        movingAverage7: ma7.slice(-1)[0], 
        movingAverage30: ma30.slice(-1)[0], 
        rsi: rsi.slice(-1)[0], 
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log('Price and indicators logged:', data))
      .catch((error) => console.error('Error logging price and indicators:', error));
  }

  function exportToCSV(data: HistoricalDataPoint[]) {
    const headers = ['Timestamp', 'Price', '7-day MA', '30-day MA', 'RSI'];
    const rows = data.map((point, index) => {
      return [
        new Date(point.timestamp).toLocaleString(),
        point.price.toFixed(2),
        movingAverage7[index] ? movingAverage7[index].toFixed(2) : '',
        movingAverage30[index] ? movingAverage30[index].toFixed(2) : '',
        rsi[index] ? rsi[index].toFixed(2) : '',
      ];
    });
    rows.unshift(headers);

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coinId}prices.csv`;
    link.click();
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Cryptocurrency Analysis - {coin?.name}</h1>
      </header>

      <section className="dashboard-content">
        {/* Data Table */}
        <div className="data-table">
          <h2>Market Data</h2>
          {coin ? (
            <table>
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Price (USD)</th>
                  <th>24h Volume</th>
                  <th>Market Cap</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><img src={coin.image} alt={coin.name} style={{ width: '32px', height: '32px' }} /></td>
                  <td>{coin.name}</td>
                  <td>{coin.symbol}</td>
                  <td>${coin.current_price.toFixed(2)}</td>
                  <td>{coin.total_volume.toLocaleString()}</td>
                  <td>${coin.market_cap.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          ) : <p>Loading...</p>}
        </div>

        <div className="indicators">
          <h2>Indicators</h2>
          <table>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>7-day Moving Avg</td>
                <td>{movingAverage7.slice(-1)[0]?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>30-day Moving Avg</td>
                <td>{movingAverage30.slice(-1)[0]?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>RSI</td>
                <td>{rsi.slice(-1)[0]?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Chart */}
        <div>
        <canvas id={`chart-${coinId}`}></canvas>        
        </div>

        {/* Download CSV */}
        <button onClick={() => exportToCSV(historicalPrices)}>Download CSV</button>
      </section>
    </div>
  );
}