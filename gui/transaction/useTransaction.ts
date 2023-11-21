import React from "react";
import axios from "axios";
import { ITransaction } from "./ITransaction";
export function useTransaction(id: string) {
  const [transaction, setTransaction] = React.useState<ITransaction | null>(
    null
  );
  React.useEffect(() => {
    const URL = "/api/transactions/" + id;
    axios
      .get(URL)
      .then((axiosResponse) => {
        setTransaction(axiosResponse.data);
      })
      .catch((e) => alert("Sorry something went wrong"));
  }, [id]);

  return transaction;
}
