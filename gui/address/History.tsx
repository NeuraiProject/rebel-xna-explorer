import * as React from "react";
import axios from "axios";
import { Loading, Table } from "../components";
import { useFetch } from "../useFetch";
import { getHistory } from "@neuraiproject/neurai-history-list";
import { formatAmount } from "../amount";
export function History({ address }: { address: string | null }) {
  const URL = "/api/addressdeltas/" + encodeURIComponent("" + address);

  const { data: _deltas, error } = useFetch(URL);
  if (error) {
    return <div>Could not load history: {error}</div>;
  }
  if (!_deltas) {
    return (
      <div>
        <Loading></Loading>
      </div>
    );
  }

  const history = getHistory(_deltas);

  //Sort by height
  history.sort((d1: IHeight, d2: IHeight) =>
    d1.blockHeight > d2.blockHeight ? -1 : 1
  );

  //If addy has more than 100 items, show a link to full list
  let fullLink: string | React.ReactElement = "";
  if (_deltas.length > 100) {
    fullLink = (
      <div>
        This address has {_deltas.length.toLocaleString()} history items.{" "}
        <a href={URL}>Full history</a>
      </div>
    );
  }

  interface IHeight {
    blockHeight: number;
  }

  const rows: any[] = [];
  const MAX_ROWS = 100;

  history.map((historyItem, index) => {
    if (index >= MAX_ROWS) {
      return;
    }
    const URL = "/tx/" + historyItem.transactionId;

    for (let asset of historyItem.assets) {
      const obj = (
        <Table.Row key={historyItem.transactionId + "_" + asset.assetName}>
          <Table.Cell>
            <a href={URL}>{asset.assetName}</a>
          </Table.Cell>
          <Table.Cell>{formatAmount(asset.value)}</Table.Cell>
          <Table.Cell>{historyItem.blockHeight.toLocaleString()}</Table.Cell>
          <Table.Cell>
            <Time height={historyItem.blockHeight}></Time>
          </Table.Cell>
        </Table.Row>
      );
      rows.push(obj);
    }
  });

  return (
    <div>
      {fullLink}
      <Table>
        <Table.Header>
          <Table.Column>Asset</Table.Column>
          <Table.Column>Amount</Table.Column>
          <Table.Column>Block height</Table.Column>
          <Table.Column>Date</Table.Column>
        </Table.Header>
        <Table.Body>{rows}</Table.Body>
      </Table>
    </div>
  );
}

//Rows often share a block: ask once per height, and only for the header
const blockTimeCache: { [height: number]: Promise<number> } = {};
function getBlockTime(height: number): Promise<number> {
  if (!blockTimeCache[height]) {
    blockTimeCache[height] = axios
      .get("/api/blockheader/" + height)
      .then((response) => response.data.time);
    blockTimeCache[height].catch(() => delete blockTimeCache[height]);
  }
  return blockTimeCache[height];
}

function Time({ height }: { height: number }) {
  const [time, setTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getBlockTime(height)
      .then((t) => {
        if (!cancelled) setTime(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [height]);

  if (time === null) {
    return null;
  }
  return <div>{new Date(1000 * time).toLocaleString()}</div>;
}
