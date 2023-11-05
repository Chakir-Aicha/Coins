import { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import '../styles/globals.css';
import Link from 'next/link';

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
  market_data: {
    price_change_percentage_7d: number;
     price_change_percentage_1h_in_currency: { [currency: string]: number };
  };
}

interface HistoricalDataPoint {
  price: number;
  timestamp: number;
  // Add other properties as needed
}


export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items to display per page
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);

  useEffect(() => {
    async function fetchCoins() {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=2&sparkline=false&locale=en'
        );
        if (response.ok) {
          const data = await response.json();
          setCoins(data);
        } else {
          console.error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    fetchCoins();
  }, []);

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
  

  async function initializeCharts() {
    for (const coin of coins) {
      const historicalData = await fetchHistoricalDataForCoin(coin.id);
      const labels = historicalData.map((dataPoint) => dataPoint.timestamp);
      const data = historicalData.map((dataPoint) => dataPoint.price);

      const ctx = document.getElementById(`chart-${coin.id}`) as HTMLCanvasElement;
      new Chart(ctx, {
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
  }

  useEffect(() => {
    if (coins.length > 0) {
      initializeCharts();
    }
  }, [coins]);

   // New function to handle search input changes and filter the coins
   const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    const filtered = coins.filter((coin) =>
      coin.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCoins(filtered);
  };

  // New function to handle Enter key press for navigating to a coin's row
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filteredCoins.length === 1) {
      const coinId = filteredCoins[0].id;
      window.location.href = `/coin/${coinId}`;
    }
  };

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  // Calculate the start and end index of the items to display
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return (
    <div>
      <h1>Cryptocurrency Catalog</h1>
      <div className="container mt-4">
      <div className="search-container mb-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyPress={handleKeyPress}
          />
        </div>
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
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody className="crypto-list">
              {searchQuery
                ? filteredCoins.slice(startIndex, endIndex).map((coin, index) => (
                    <tr key={coin.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="mr-2"
                            style={{ width: '32px', height: '32px' }}
                          />
                        </div>
                      </td>
                      <td>{coin.name}</td>
                      <td>{coin.symbol}</td>
                      <td>${coin.current_price}</td>
                      <td>{coin.price_change_percentage_1h_in_currency}%</td>
                      <td>{coin.price_change_percentage_24h}%</td>
                      <td>{coin.price_change_percentage_7d}%</td>
                      <td>{coin.total_volume.toFixed(2)} </td>
                      <td>${coin.market_cap}</td>
                      <td>
                        <div className="graph">
                          <canvas id={`chart-${coin.id}`} width="200" height="100"></canvas>
                        </div>
                      </td>
                      <td>
                        <Link href={`/coin/${coin.id}`}>
                          <a>View Details</a>
                        </Link>
                      </td>
                    </tr>
                  ))
                : coins.slice(startIndex, endIndex).map((coin, index) => (
                    <tr key={coin.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="mr-2"
                            style={{ width: '32px', height: '32px' }}
                          />
                        </div>
                      </td>
                      <td>{coin.name}</td>
                      <td>{coin.symbol}</td>
                      <td>${coin.current_price}</td>
                      <td>{coin.price_change_percentage_1h_in_currency}%</td>
                      <td>{coin.price_change_percentage_24h}%</td>
                      <td>{coin.price_change_percentage_7d}%</td>
                      <td>{coin.total_volume.toFixed(2)} </td>
                      <td>${coin.market_cap}</td>
                      <td>
                        <div className="graph">
                          <canvas id={`chart-${coin.id}`} width="200" height="100"></canvas>
                        </div>
                      </td>
                      <td>
                        <Link href={`/coin/${coin.id}`}>
                          <a>View Details</a>
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>

        </table>
        <div className="pagination">
          {currentPage > 1 && (
            <button onClick={prevPage}>Previous</button>
          )}
          {coins.length > endIndex && (
            <button onClick={nextPage}>Next</button>
          )}
        </div>
        <br/>
        <hr />
      </div>
    </div>
  );
}