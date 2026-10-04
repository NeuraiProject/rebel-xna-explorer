import React from "react";
import axios from "axios";

export interface IFetchResult {
  data: any;
  error: string | null;
}

export function useFetch(url: string): IFetchResult {
  const [result, setResult] = React.useState<IFetchResult>({
    data: null,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    setResult({ data: null, error: null });
    axios
      .get(url)
      .then((response) => {
        if (!cancelled) setResult({ data: response.data, error: null });
      })
      .catch((e) => {
        const message = e?.response?.data?.error || e?.message || "" + e;
        if (!cancelled) setResult({ data: null, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return result;
}
