import React from "react";
import axios from "axios";

export interface IConfig {
  baseCurrency: string
  neurai_password: string
  neurai_username: string
  neurai_url: string
  httpPort: number
  headline: string
  theme: string
  ipfs_gateway: string
  price_lookup_enabled?: boolean
}

export function useConfig():IConfig | null {
  const [config, setConfig] = React.useState(null);

  React.useEffect(() => {
    axios.get("/gui-settings").then((response) => {
      setConfig(response.data);
    });
  }, []);

  return config;
}
