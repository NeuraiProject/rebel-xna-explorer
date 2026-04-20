import * as React from "react";
import axios from "axios";

export function useNeuraiUSD() {
  const [usdRate, setUsdRate] = React.useState<null | number>(null);

  React.useEffect(() => {
    let cancelled = false;
    let interval: any = null;

    async function fetchPrice() {
      try {
        const URL =
          "https://api.coingecko.com/api/v3/simple/price?ids=neurai&vs_currencies=usd";
        const response = await axios.get(URL);
        const value = response.data?.neurai?.usd;
        if (value !== undefined && !cancelled) {
          setUsdRate(value);
        }
      } catch (error) {
        console.error("Error fetching XNA price from CoinGecko:", error);
      }
    }

    axios
      .get("/gui-settings")
      .then((r) => {
        if (cancelled) return;
        if (r.data?.price_lookup_enabled === false) return;
        fetchPrice();
        interval = setInterval(fetchPrice, 60000);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  return usdRate;
}
