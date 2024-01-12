import React from "react";
import axios from "axios";
export function useFetch(url: string): any {
  const [data, setData] = React.useState<null | object>(null);

  React.useEffect(() => {
    async function work() {
      const response = await axios.get(url);
      setData(response.data);
    }
    work();
  }, [url]);
  return data;
}
