import * as React from "react";
import axios from "axios";
import { getParam } from "./getParam";
import { Meta } from "./AssetModal";
import { Loading, Spacer, Table } from "./components";
import { MyCard } from "./MyCard";
import useAssetData from "./useAssetData";
import { Amount, formatAmount } from "./amount";

interface IHolder {
  address: string;
  amount: Amount;
}

interface IAssetAddressesResponse {
  ownerAddress: string | null;
  ownerAmount: Amount | null;
  holders: IHolder[];
}

export function Asset() {
  const assetName = "" + getParam("name");
  const data = useAssetData(assetName);
  const [addresses, setAddresses] = React.useState<IAssetAddressesResponse | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!assetName) return;
    const URL = "/api/assetaddresses/" + encodeURIComponent(assetName);
    axios
      .get(URL)
      .then((r) => setAddresses(r.data))
      .catch(() => setError("Could not load the holders"));
  }, [assetName]);

  if (data === undefined) {
    return <Loading />;
  }
  if (!data) {
    return (
      <div>
        <h3>Cant find data about {assetName}</h3>
      </div>
    );
  }

  //The owner holds ASSET!, not necessarily ASSET: show it apart from the holders
  const ownerAddress = addresses?.ownerAddress || null;
  const holders = addresses?.holders || [];

  const holdersHeader = `Holders (${addresses ? holders.length.toLocaleString() : "..."})`;

  const ownerLine = ownerAddress && (
    <>
      <div>
        <span className="badge badge-sm" title={`Holds ${assetName}!`}>
          Owner
        </span>{" "}
        <a href={"/address/" + ownerAddress}>{ownerAddress}</a>
      </div>
      <Spacer />
    </>
  );

  const holdersBody = !addresses ? (
    error ? (
      <div>{error}</div>
    ) : (
      <Loading />
    )
  ) : (
    <>
      {ownerLine}
      {holders.length === 0 ? (
        <div>No addresses hold this asset.</div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Column>#</Table.Column>
            <Table.Column>Address</Table.Column>
            <Table.Column>Amount</Table.Column>
          </Table.Header>
          <Table.Body>
            {holders.map((row, idx) => {
              const URL = "/address/" + row.address;
              return (
                <Table.Row key={row.address}>
                  <Table.Cell>
                    {idx + 1}
                    {row.address === ownerAddress && (
                      <>
                        {" "}
                        <span className="badge badge-sm">Owner</span>
                      </>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <a href={URL}>{row.address}</a>
                  </Table.Cell>
                  <Table.Cell>{formatAmount(row.amount)}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      )}
    </>
  );

  return (
    <div>
      <h1>{assetName}</h1>
      <MyCard header="Asset data" body={<Meta asset={data} />} />
      <Spacer />
      <MyCard header={holdersHeader} body={holdersBody} />
    </div>
  );
}
