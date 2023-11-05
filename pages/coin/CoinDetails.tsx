import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import '../../styles/globals.css';

const CoinDetails = () => {
  const router = useRouter();
  const { coinId } = router.query; // Get the coinId from the dynamic route


// This will get the coinId from the URL
  const [coinDetails, setCoinDetails] = useState<any>(null); // Define a state variable to store coin details

  useEffect(() => {
    // Fetch the details of the selected coin using the coinId
    async function fetchCoinDetails() {
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Coin Details:', data); // Log the fetched data to the console
          setCoinDetails(data);
        } else {
          console.error('Failed to fetch coin details');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    if (coinId) {
      fetchCoinDetails();
    }
  }, [coinId]);

  // Render the details of the selected coin here
  return (
    <div className="coin-details-card"> {/* Apply the coin-details-card style */}
      <h1 className="coin-details-title">{coinId}</h1>
      {coinDetails && (
        <div>
          <h2>{coinDetails.name}</h2>
          <p className="coin-details-data">Symbol: <span className="coin-details-symbol">{coinDetails.symbol}</span></p>
          <p className="coin-details-data">Market Cap: <span className="coin-details-rank">{coinDetails.market_cap}</span></p>
          <p className="coin-details-data">Total Trading Volume: <span className="coin-details-rank">{coinDetails.volume}</span></p>
          <p className="coin-details-data">Fully diluted Valuation: <span className="coin-details-rank">{coinDetails.fully_diluted_valuation}</span></p>
          <p className="coin-details-data">Circulating Supply: <span className="coin-details-rank">{coinDetails.circulating_supply}</span></p>
          <p className="coin-details-data">Total Supply: <span className="coin-details-rank">{coinDetails.total_supply}</span></p>
          <p className="coin-details-data">Max Supply: <span className="coin-details-rank">{coinDetails.max_supply}</span></p>
        </div>
      )}
    </div>
  );
};

export default CoinDetails;
