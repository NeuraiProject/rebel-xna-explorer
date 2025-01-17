import * as React from "react";
import { Loading, Table } from "@nextui-org/react";
import { useFetch } from "../useFetch";
import { getHistory } from "@neuraiproject/neurai-history-list";
export function History({ address }: { address: string | null }) {
  const URL = "/api/addressdeltas/" + address;

  const _deltas = useFetch(URL);
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
    if (index > MAX_ROWS) {
      return;
    }
    const URL = "?route=TRANSACTION&id=" + historyItem.transactionId;

    for (let asset of historyItem.assets) {
      const obj = (
        <Table.Row key={historyItem.transactionId}>
          <Table.Cell>
            <a href={URL}>{asset.assetName}</a>
          </Table.Cell>
          <Table.Cell>{asset.value.toLocaleString()}</Table.Cell>
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
        <Table.Pagination
          shadow
          noMargin
          align="center"
          rowsPerPage={10}
          onPageChange={(page) => console.log({ page })}
        />
      </Table>
    </div>
  );
}

function Time({ height }) {
  const block = useFetch("/api/blocks/" + height);

  if (!block) {
    return null;
  }
  return <div>{new Date(1000 * block.time).toLocaleString()}</div>;
}
