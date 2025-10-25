import * as React from "react";
import axios from "axios";

export function useNeuraiUSD() {
  const [usdRate, setUsdRate] = React.useState<null | number>(null);

  React.useEffect(() => {
    async function work() {
      try {
        // CoinGecko Free API endpoint
        const URL = "https://api.coingecko.com/api/v3/simple/price?ids=neurai&vs_currencies=usd";
        const response = await axios.get(URL);
        const value = response.data?.neurai?.usd;
        if (value !== undefined) {
          setUsdRate(value);
        }
      } catch (error) {
        console.error("Error fetching XNA price from CoinGecko:", error);
      }
    }
    work();
    
    // Refresh price every 60 seconds
    const interval = setInterval(work, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return usdRate;
}
