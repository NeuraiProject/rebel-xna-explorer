import * as React from "react";
import { Modal, Text } from "./components";
import useAssetData from "./useAssetData";

export function Meta({ asset }) {
  const ipfs = asset.ipfs_hash;

  return (
    <>
      <pre>{JSON.stringify(asset, null, 4)}</pre>
      {ipfs && (
        <div
          style={{
            textAlign: "center",
          }}
        >
          <a href={"https://ipfs.io/ipfs/" + ipfs} target="_blank">
            IPFS link
            <br />
            <img
              width="200"
              src={"/thumbnail?assetName=" + encodeURIComponent(asset.name)}
            />
          </a>
        </div>
      )}
    </>
  );
}
export function AssetModal({ modalVisible, closeModal, assetName }) {
  if (modalVisible === false) {
    //Returned a closed modal
    return <Modal visible={modalVisible} onClose={closeModal} />;
  }
  const asset = useAssetData(assetName);
  if (!asset) {
    //Returned a closed modal
    return <Modal visible={modalVisible} onClose={closeModal} />;
  }
  return (
    <Modal
      visible={modalVisible}
      onClose={closeModal}
    >
      <Modal.Header>
        <Modal.Title>
          Asset data for <Text b size={18}>{asset.name}</Text>
        </Modal.Title>
        <button className="modal-close" onClick={closeModal}>×</button>
      </Modal.Header>
      <Modal.Body>
        <Meta asset={asset} />
      </Modal.Body>
    </Modal>
  );
}
