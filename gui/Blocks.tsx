import * as React from "react";
import axios from "axios";
import { Card, Spacer, Table, Text } from "@nextui-org/react";
import { MyCard } from "./MyCard";

interface IBlock {
  height: number;
  time: number;
  hash: string;
  tx: any;
}
export function Blocks() {
  const [blocks, setBlocks] = React.useState<IBlock[]>([]);
  const [mempool, setMempool] = React.useState({});
  React.useEffect(() => {
    async function work() {
      const URL = "/api/blocks";
      const axiosResponse = await axios.get(URL);

      const b = axiosResponse.data;
      window.document.title = b[0].height.toLocaleString();
      setBlocks(b);

      const r = await axios.get("/api/mempool");
      setMempool(r.data);
    }
    work();

    const interval = setInterval(work, 20000);
    return () => {
      clearInterval(interval as any);
    };
  }, []);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  const header = "Blocks";
  const body = (
    <Table
      selectionMode="single"
      onSelectionChange={(keys) => {
        const blockHash = Object.values(keys)[0];
        const URL = "index.html?route=BLOCK&hash=" + blockHash;
        window.location.href = URL;
      }}
    >
      <Table.Header>
        <Table.Column>Height</Table.Column>
        <Table.Column>Time</Table.Column>
        <Table.Column>Transactions</Table.Column>
      </Table.Header>
      <Table.Body>
        {blocks.map((block) => {
          const URL = "index.html?route=BLOCK&hash=" + block.hash;

          const time = new Date(block.time * 1000).toLocaleString();
          return (
            <Table.Row key={block.hash}>
              <Table.Cell>
                <a href={URL}>{block.height.toLocaleString()}</a>
              </Table.Cell>
              <Table.Cell>{time}</Table.Cell>
              <Table.Cell>{block.tx.length}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );

  return (
    <div>
      <MyCard header={header} body={body} />
      <Spacer /> <Spacer />
      <MyCard header="Mempool items" body={Object.keys(mempool).length} />
      <Spacer />
    </div>
  );
}
