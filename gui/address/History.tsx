import * as React from "react";
import { Loading, Table } from "@nextui-org/react";
import { useFetch } from "../useFetch";

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
  //Sort by height
  _deltas.sort((d1: IHeight, d2: IHeight) => (d1.height > d2.height ? -1 : 1));

  //Only show the last 100 items
  const deltas = _deltas.length > 100 ? _deltas.slice(0, 100) : _deltas;

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
    height: number;
  }

  const rows = deltas.map((delta) => {
    const URL = "?route=TRANSACTION&id=" + delta.txid;
    return (
      <Table.Row key={delta.txid + "_" + delta.index}>
        <Table.Cell>
          <a href={URL}>{delta.assetName}</a>
        </Table.Cell>
        <Table.Cell>{delta.amount.toLocaleString()}</Table.Cell>
        <Table.Cell>{delta.height.toLocaleString()}</Table.Cell>
        <Table.Cell>
          <Time height={delta.height}></Time>
        </Table.Cell>
      </Table.Row>
    );
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
