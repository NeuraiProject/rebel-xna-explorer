import * as React from "react";
import axios from "axios";
import { getParam } from "./getParam";
import { Meta } from "./AssetModal";
import { Loading, Spacer, Table } from "./components";
import { MyCard } from "./MyCard";
import useAssetData from "./useAssetData";

interface IHolder {
  address: string;
  amount: number;
}

interface IAssetAddressesResponse {
  ownerAddress: string | null;
  ownerAmount: number | null;
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
      .catch(() => setError("No se pudieron cargar las direcciones"));
  }, [assetName]);

  if (!data) {
    return (
      <div>
        <h3>Cant find data about {assetName}</h3>
      </div>
    );
  }

  const ownerAddress = addresses?.ownerAddress || null;
  const isOwnerAsset = assetName.endsWith("!");

  const rows: Array<IHolder & { isOwner: boolean }> = [];
  if (addresses) {
    if (ownerAddress) {
      rows.push({
        address: ownerAddress,
        amount: addresses.ownerAmount ?? 1,
        isOwner: true,
      });
      addresses.holders
        .filter((h) => h.address !== ownerAddress)
        .forEach((h) => rows.push({ ...h, isOwner: false }));
    } else {
      addresses.holders.forEach((h) => rows.push({ ...h, isOwner: false }));
    }
  }

  const holdersHeader = `Holders (${addresses ? rows.length.toLocaleString() : "..."})`;

  const holdersBody = !addresses ? (
    error ? (
      <div>{error}</div>
    ) : (
      <Loading />
    )
  ) : rows.length === 0 ? (
    <div>No hay direcciones con este asset.</div>
  ) : (
    <Table>
      <Table.Header>
        <Table.Column>#</Table.Column>
        <Table.Column>Address</Table.Column>
        <Table.Column>Amount</Table.Column>
      </Table.Header>
      <Table.Body>
        {rows.map((row, idx) => {
          const URL = "/address/" + row.address;
          return (
            <Table.Row key={row.address}>
              <Table.Cell>
                {row.isOwner ? (
                  <span
                    className="badge badge-sm"
                    title={`Owner (${assetName}!)`}
                  >
                    Owner
                  </span>
                ) : (
                  idx + (ownerAddress ? 0 : 1)
                )}
              </Table.Cell>
              <Table.Cell>
                <a href={URL}>{row.address}</a>
              </Table.Cell>
              <Table.Cell>{row.amount.toLocaleString()}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );

  return (
    <div>
      <h1>{assetName}</h1>
      <MyCard header="Asset data" body={<Meta asset={data} />} />
      <Spacer />
      {!isOwnerAsset && (
        <MyCard header={holdersHeader} body={holdersBody} />
      )}
      {isOwnerAsset && <MyCard header={holdersHeader} body={holdersBody} />}
    </div>
  );
}
