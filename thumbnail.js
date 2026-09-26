import sharp from "sharp";
import blockchain from "./blockchain.js";
import fs from "fs";
import axios from "axios";
import path from "path";
import getConfig from "./getConfig.js";
let ipfsByAssetName = {};

let blockedIPFS = {};

const config = getConfig();

/*
  Summary
  Get meta data for asset, to get IPFS cid (hash).
  Check with IPFS Gateway (HTTP Head) the content type and size of the object.
  IPFS can point to anything, could be a 10gb movie or a pdf
 
  Happy flow - data not cached

  - check meta data for asset X
  - validate that conten type is image and size less than X mb.
  - write contentType to disk in file *IPFS*_contentype
  - generate thumbnail and write binary to *ipfs* file
  - respond with image to 


  Happy flow - data cached
  - check in memory cache (map) if we have IPFS for asset
  - check if file *ipfs*_contentype content say image
  - return image to user

  Odd case


*/

//Clear asset name > ipfs hash cache very X minutes
const HOUR = 3600000;
setInterval(function () {
  ipfsByAssetName = {};
  blockedIPFS = {};
}, HOUR / 4);
const dir = path.resolve("./images");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

//Download the image and scale it down, keeping the original format
async function createThumbnail(url, width, maxSize) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    //The size from HTTP HEAD can lie, never download more than maxSize
    maxContentLength: maxSize,
  });
  return sharp(Buffer.from(response.data))
    .resize({ width, withoutEnlargement: true, fit: "contain" })
    .flatten({ background: "#ffffff" })
    .toBuffer();
}

export default async function thumbnail(request, response) {
  const assetName = request.query.assetName;
  if (!assetName) {
    response.status(400).send({ error: "No assetName query parameter" });
    return;
  }

  //Get IPFS for asset, check if cached
  let ipfs = ipfsByAssetName[assetName];
  try {
    if (!ipfs) {
      const data = await blockchain.getAssetData(assetName);
      if (data) {
        ipfs = data.ipfs_hash;
        ipfsByAssetName[assetName] = ipfs;
      }
    }
  } catch (e) {
    response.set("when", "fetching-asset-metadata");
    response.status(500).send({
      error: "Technical error please try again later",
      description: "" + e,
    });
    return;
  }

  if (!ipfs) {
    response.status(204).send({ error: `${assetName} cant find IPFS` });
    return;
  }

  if (blockedIPFS[ipfs]) {
    response.set("c-blocked", "could not get meta info from IPFS");
    response.status(500).send({
      error: "Could not get meta data from IPFS Gateway about " + ipfs,
      description: ipfs + " is blocked for about 60 minutes, try again later",
    });
    return;
  }

  function isImage(contentType) {
    const isImage = contentType.indexOf("image") > -1;
    return isImage;
  }

  const contentTypeFilePath = "./images/" + ipfs + "_contentType";
  const contentFilePath = "./images/" + ipfs;

  //If we have the content type but its not an image, return
  if (fs.existsSync(contentTypeFilePath)) {
    const contentType = fs.readFileSync(contentTypeFilePath, "utf-8");
    if (isImage(contentType) === false) {
      response.status(204).send({
        error: "Wrong content type ",
        contentType,
      });
      return;
    }
  }

  //File exists, we have already cached it
  if (fs.existsSync(contentFilePath)) {
    response.set("c-from-cache", true);

    try {
      const contentType = fs.readFileSync(contentTypeFilePath, "utf-8");
      response.set("content-type", contentType);
    } catch (e) {
      //If problem with the content type file, delete it
      fs.rmSync(contentTypeFilePath, {
        force: true,
      });
    }

    response.set("ipfs", ipfs);
    response.send(fs.readFileSync(contentFilePath));
    return;
  }

  console.log("Do NOT have info for", ipfs, "asking", config.ipfs_gateway);
  response.set("fetch-ipfs", "fetching asset from IPFS");
  //Ask IPFS gateway for size
  const url = config.ipfs_gateway + ipfs;

  try {
    const config = {
      timeout: 5000, //5 seconds timeout
      headers: {
        "Accept-Encoding": "gzip,deflate,compress",
      },
    };
    const asdf = await axios.head(url, config);
    console.log("HTTP HEAD, response for", ipfs);
    const size = asdf.headers["content-length"];
    const contentType = asdf.headers["content-type"];

    console.log("HTTP HEAD size/content type", size, contentType, ipfs);
    fs.writeFileSync(contentTypeFilePath, contentType || "EMPTY");

    //Cache content type
    if (isImage(contentType) === false) {
      response.status(400).send({
        error: "Not an image",
        contentType,
      });
      return;
    }

    response.set("c-exists-on-disk", "" + fs.existsSync(contentFilePath));
    if (fs.existsSync(contentFilePath) === true) {
      const asdf = fs.readFileSync("./images/" + ipfs);
      response.set("content-type", contentType);
      response.set("from-cache", "true");
      response.set("ipfs", ipfs);
      response.send(asdf);
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (size < MAX_SIZE) {
      //Fetch the binary data for the image from IPFS
      const thumbnail = await createThumbnail(url, 300, MAX_SIZE);

      fs.writeFileSync(contentFilePath, thumbnail);
      fs.writeFileSync(contentTypeFilePath, contentType);
      response.set("content-type", contentType);
      response.set("ipfs", ipfs);
      response.send(thumbnail);
      return;
    } else {
      return response.status(400).send({
        error: "Content to large",
        "content-length": size,
        "max-size": MAX_SIZE,
      });
    }
    response.send(size);
  } catch (e) {
    console.log(ipfs, "mega error", e + "");

    blockedIPFS[ipfs] = new Date().getMilliseconds();
    response.status(500).send({ error: e + "" });
    return;
  }
}
