import * as React from "react";
import axios from "axios";

export function useRavencoinUSD() {
  const [usdRate, setUsdRate] = React.useState<null | number>(null);

  React.useEffect(() => {
    async function work() {
      const URL = "https://api1.binance.com/api/v3/ticker/price?symbol=RVNUSDT";
      const response = await axios.get(URL);
      const value = parseFloat(response.data.price);
      setUsdRate(value);
    }
    work();
  });
  return usdRate;
}
