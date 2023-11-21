import { Loading, Table } from "@nextui-org/react";
import axios from "axios";
import { debounce } from "lodash";
import * as React from "react";
import { MyCard } from "./MyCard";

import { Input, Pagination, Spacer } from "@nextui-org/react";
import { AssetImageLink } from "./AssetImageLink";
import { AssetModal } from "./AssetModal";
import useAssetData from "./useAssetData";

export function Assets() {
  const [assets, setAssets] = React.useState([]);
  const [gatewayURL, setGatewayURL] = React.useState(
    "https://cloudflare-ipfs.com/ipfs/"
  );
  const [filterText, setFilterText] = React.useState("");
  const [modalVisible, setModalVisible] = React.useState(false);

  //If we have selected an asset
  const [selectedAssetName, setSelectedAssetName] = React.useState("");

  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 25;

  const showModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const debouncedSearch = React.useRef(
    debounce(async (value) => {
      setFilterText(value);
      setPage(1); //always reset the paginator when search changes
    }, 300)
  ).current;

  React.useEffect(() => {
    axios.get("/gui-settings").then((response) => {
      const settings = response.data;
      const gateway = settings.ipfs_gateway;
      setGatewayURL(gateway);
    });
    axios
      .get("/api/assets")
      .then((axiosResponse) => {
        setAssets(axiosResponse.data);
      })
      .catch((e) => {
        alert("Something went wrong when fetching assets");
      });
  }, []);

  if (!assets) {
    return <Loading />;
  }
  const names = assets as any[];

  const assetsToShow = names.filter((asset: string) => {
    if (!filterText) {
      return true;
    }
    const filter = filterText.toUpperCase();

    return asset.toUpperCase().startsWith(filter);
  });

  let header = "Assets (" + names.length.toLocaleString() + ")";

  const displayedAssets = assetsToShow.filter(function (asset, index) {
    const lowerLimit = page * PAGE_SIZE - PAGE_SIZE;
    const upperLimit = page * PAGE_SIZE;

    if (index < lowerLimit) {
      return false;
    }

    if (index >= upperLimit) {
      return false;
    }
    return true;
  });
  const body = (
    <>
      <Input
        label=""
        clearable
        bordered
        onChange={(event) => {
          const value = event.target.value;
          debouncedSearch(value);
        }}
      />
      <Spacer />

      <MyPaginator
        page={page}
        pageSize={PAGE_SIZE}
        total={assetsToShow.length}
        setPage={setPage}
      ></MyPaginator>
      <Spacer />

      <AssetModal
        modalVisible={modalVisible}
        closeModal={closeModal}
        assetName={selectedAssetName}
      />

      <Table
        aria-label="Example table with static content"
        css={{
          height: "auto",
          minWidth: "100%",
        }}
      >
        <Table.Header>
          <Table.Column>NR</Table.Column>
          <Table.Column>Name</Table.Column>
          <Table.Column>IPFS</Table.Column>
          <Table.Column>Amount</Table.Column>
        </Table.Header>
        <Table.Body>
          {displayedAssets.map((assetName: string) => {
            return (
              <Table.Row key={assetName}>
                <Table.Cell>{names.indexOf(assetName) + 1}</Table.Cell>
                <Table.Cell>
                  <a
                    title={assetName}
                    href={"#"}
                    onClick={() => {
                      setSelectedAssetName(assetName);

                      showModal();
                    }}
                  >
                    {assetName}
                  </a>
                </Table.Cell>
                <Table.Cell>
                  <AssetImageLink
                    assetName={assetName}
                    gatewayURL={gatewayURL}
                  ></AssetImageLink>
                </Table.Cell>

                <Table.Cell>
                  <AssetAmount assetName={assetName} />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </>
  );
  return <MyCard header={header} body={body} />;
}
function AssetAmount({ assetName }) {
  const asset = useAssetData(assetName);

  if (!asset) {
    return null;
  }

  return <div>{asset.amount.toLocaleString()}</div>;
}
function MyPaginator({ setPage, total, page, pageSize }) {
  const numberOfPages = Math.ceil(total / pageSize);
  return (
    <div>
      <Pagination total={numberOfPages} page={page} onChange={setPage} />
    </div>
  );
}
