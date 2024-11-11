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
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const coinId = 'bitcoin';

  useEffect(() => {
    async function fetchCoin() {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&sparkline=false&nocache=${Date.now()}`
        );
        if (response.ok) {
          const data = await response.json();
          const coinData = data[0];
          setCoin(coinData);
        } else {
          console.error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching coin data:', error);
      }
    }

    
    fetchCoin();
  }, [coinId]);
  useEffect(() => {
    if (coin) {
      // Log the price every 10 seconds
      const intervalId = setInterval(() => {
        fetch('/api/logPrice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price: coin.current_price }),
        })
          .then((response) => response.json())
          .then((data) => console.log('Price logged:', data))
          .catch((error) => console.error('Error logging price:', error));
      }, 10000);
  
      return () => clearInterval(intervalId);
    }
  }, [coin]);  // Ne dépend plus de previousPrice ni coinId
  
  useEffect(() => {
    if (coin) {
      initializeChart(coin.id);
    }
  }, [coin]);

  async function fetchHistoricalDataForCoin(coinId: string): Promise<HistoricalDataPoint[]> {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/?vs_currency=usd&days=7`);
    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }
    const historicalData: any = await response.json();
  
    return historicalData.prices.map((pricePoint: [number, number]) => ({
      timestamp: pricePoint[0],
      price: pricePoint[1],
    }));
  }
  async function initializeChart(coinId: string) {
    const historicalData = await fetchHistoricalDataForCoin(coinId);
    const labels = historicalData.map((dataPoint) => new Date(dataPoint.timestamp).toLocaleDateString());
    const data = historicalData.map((dataPoint) => dataPoint.price);

    // Si un graphique existe déjà, le détruire
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = document.getElementById(`chart-${coinId}`) as HTMLCanvasElement;
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Price Variation (Last 7 Days)',
            data,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: false,
          },
          y: {
            beginAtZero: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  return (
    <div>
      <h1>Cryptocurrency - {coin?.name}</h1>
      <div className="container mt-4">
        {coin ? (
          <table className="table crypto-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Logo</th>
                <th scope="col">Name</th>
                <th scope="col">Symbol</th>
                <th scope="col">Price (USD)</th>
                <th scope="col">Price Change (1h)</th>
                <th scope="col">Price Change (24h)</th>
                <th scope="col">Price Change (7d)</th>
                <th scope="col">24h Volume</th>
                <th scope="col">Market Cap</th>
                <th scope="col">Graph</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <img
                    src={coin.image}
                    alt={coin.name}
                    style={{ width: '32px', height: '32px' }}
                  />
                </td>
                <td>{coin.name}</td>
                <td>{coin.symbol}</td>
                <td>${coin.current_price.toFixed(2)}</td>
                <td>{coin.price_change_percentage_1h_in_currency?.toFixed(2)}%</td>
                <td>{coin.price_change_percentage_24h?.toFixed(2)}%</td>
                <td>{coin.price_change_percentage_7d?.toFixed(2)}%</td>
                <td>{coin.total_volume.toLocaleString()}</td>
                <td>${coin.market_cap.toLocaleString()}</td>
                <td>
                  <div className="graph">
                    <canvas id={`chart-${coin.id}`} width="200" height="100"></canvas>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
