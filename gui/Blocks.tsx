import * as React from "react";
import axios from "axios";
import { Spacer, Table } from "./components";
import { MyCard } from "./MyCard";

interface IBlock {
  height: number;
  time: number;
  hash: string;
  tx: any;
  size: number;
}

function formatSize(bytes: number): string {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

function FormattedDateTime({ unix }: { unix: number }) {
  const d = new Date(unix * 1000);
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const yy = pad(yyyy % 100);
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return (
    <>
      {dd}/{mm}/<span className="date-year-full">{yyyy}</span>
      <span className="date-year-short">{yy}</span>
      {" "}
      {hh}:{mi}
      <span className="date-seconds">:{ss}</span>
    </>
  );
}
export function Blocks() {
  const [blocks, setBlocks] = React.useState<IBlock[]>([]);
  const [mempool, setMempool] = React.useState({});
  React.useEffect(() => {
    async function work() {
      const URL = "/api/blocks";
      const axiosResponse = await axios.get(URL);

      const b = axiosResponse.data;
      setBlocks(b);

      const r = await axios.get("/api/mempool");
      setMempool(r.data);
    }
    work();

    const interval = setInterval(work, 10000);
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
        const block = blocks.find((b) => b.hash === blockHash);
        const URL = block ? "/block/" + block.height : "/blockhash/" + blockHash;
        window.location.href = URL;
      }}
    >
      <Table.Header>
        <Table.Column>Height</Table.Column>
        <Table.Column align="center">TX</Table.Column>
        <Table.Column align="center">Size</Table.Column>
        <Table.Column align="center" style={{ width: "1%", whiteSpace: "nowrap" }}>Time</Table.Column>
      </Table.Header>
      <Table.Body>
        {blocks.map((block) => {
          const URL = "/block/" + block.height;

          return (
            <Table.Row key={block.hash}>
              <Table.Cell>
                <a href={URL}>{block.height.toLocaleString()}</a>
              </Table.Cell>
              <Table.Cell align="center">{block.tx.length}</Table.Cell>
              <Table.Cell align="center">{formatSize(block.size)}</Table.Cell>
              <Table.Cell
                style={{
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <FormattedDateTime unix={block.time} />
              </Table.Cell>
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
