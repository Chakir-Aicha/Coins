import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './CoinDetailsPage.module.css';

interface CoinDetails {
  name: string;
  symbol: string;
  
  volume: number;
  price_change_24h : number ;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  coingecko_rank :number ;

  block_time_in_minutes: number;
  categories: string[];
  hashing_algorithm: string;
  description: { [key: string]: string };
  // Add more properties as needed
  // ...
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  last_updated: string;
  market_cap_rank: number;
  market_data: {
    high_24h: {
      aed: number;
      ars: number;
      aud: number;
      bch: number;
      bdt: number;
      // Add other currency properties as needed
    };
    low_24h: {
      aed: number;
      ars: number;
      aud: number;
      bch: number;
      bdt: number;
      // Add other currency properties as needed
    };
    market_cap_change_24h: number;
    price_change_percentage_7d: number;
  };
}

const CoinDetailsPage = () => {
  const router = useRouter();
  const { coinId } = router.query;
  const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);

  useEffect(() => {
    async function fetchCoinDetails() {
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
        if (response.ok) {
          const data = await response.json();
          setCoinDetails(data);
          console.log(data) ;
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

  return (
    <div className={styles.coinDetailsContainer}>
    {coinDetails && (
      <div className={styles.coinDetailsCard}>
        <h1 className={styles.coinDetailsTitle}>{coinDetails.name}</h1>
        <div className={styles.coinLogo}>
          <img src={coinDetails.image.large} alt={coinDetails.name} />
        </div>
        <div className={styles.coinDetailsInfo}>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Symbol</p>
            <p className={styles.infoValue}>{coinDetails.symbol}</p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Market Cap Rank</p>
            <p className={styles.infoValue}>{coinDetails.market_cap_rank}</p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Total Trading Volume</p>
            <p className={styles.infoValue}>{coinDetails.volume}</p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>High 24h (AED)</p>
            <p className={styles.infoValue}>
              {coinDetails.market_data.high_24h && coinDetails.market_data.high_24h.aed
                ? coinDetails.market_data.high_24h.aed.toFixed(2)
                : 'N/A'}
            </p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Low 24h (AED)</p>
            <p className={styles.infoValue}>
              {coinDetails.market_data.low_24h && coinDetails.market_data.low_24h.aed
                ? coinDetails.market_data.low_24h.aed.toFixed(2)
                : 'N/A'}
            </p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Market Cap Change 24h</p>
            <p className={styles.infoValue}>
              {coinDetails.market_data.market_cap_change_24h
                ? coinDetails.market_data.market_cap_change_24h
                : 'N/A'}
            </p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Price Change Percentage 7d</p>
            <p className={styles.infoValue}>
              {coinDetails.market_data.price_change_percentage_7d
                ? coinDetails.market_data.price_change_percentage_7d
                : 'N/A'}
            </p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Circulating Supply</p>
            <p className={styles.infoValue}>{coinDetails.circulating_supply}</p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Block Time in Minutes</p>
            <p className={styles.infoValue}>{coinDetails.block_time_in_minutes}</p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Categories</p>
            <p className={styles.infoValue}>{coinDetails.categories.join(', ')}</p>
          </div>
          <div className={styles.infoColumn}>
            <p className={styles.infoLabel}>Last Updated</p>
            <p className={styles.infoValue}>{coinDetails.last_updated}</p>
          </div>
        </div>
        <div className={styles.description}>
          <p className={styles.descriptionLabel}>Description (English):</p>
          <p className={styles.descriptionText}>{coinDetails.description.en}</p>
        </div>
      </div>
    )}
  </div>
  );
};

export default CoinDetailsPage;
