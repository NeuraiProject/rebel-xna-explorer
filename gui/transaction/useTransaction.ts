import React from "react";
import axios from "axios";
import { ITransaction } from "./ITransaction";

//Inputs of one transaction often spend outputs of the same previous transaction
const transactionCache: { [id: string]: Promise<ITransaction> } = {};
function getTransactionCached(id: string): Promise<ITransaction> {
  if (!transactionCache[id]) {
    transactionCache[id] = axios
      .get("/api/transactions/" + encodeURIComponent(id))
      .then((axiosResponse) => axiosResponse.data);
    transactionCache[id].catch(() => delete transactionCache[id]);
  }
  return transactionCache[id];
}

export function useTransaction(id: string) {
  const [transaction, setTransaction] = React.useState<ITransaction | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    setTransaction(null);
    setError(null);
    getTransactionCached(id)
      .then((data) => {
        if (!cancelled) setTransaction(data);
      })
      .catch((e) => {
        const message = e?.response?.data?.error || e?.message || "" + e;
        if (!cancelled) setError(message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { transaction, error };
}
