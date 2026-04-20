import fs from "fs";

const defaultConfig = {
  baseCurrency: "XNA",
  neurai_password: "anonymous",
  neurai_username: "anonymous",
  neurai_url: "https://rpc-testnet.neurai.org/rpc",
  httpPort: 8888,
  headline: "Neurai Testnet",
  theme: "dark",
  ipfs_gateway: "https://gateway.pinata.cloud/ipfs/",
};
const PROMPT_USER_TO_UPDATE_MESSAGE =
  "Please update your ./config.json file with your info";
export default function getConfig() {
  createConfigIfNeeded();

  const text = Buffer.from(fs.readFileSync("./config.json"));
  const config = JSON.parse(text);
  validateConfig(config);

  return config;
}

function createConfigIfNeeded() {
  if (fs.existsSync("./config.json") === false) {
    const text = JSON.stringify(defaultConfig, null, 4);
    fs.writeFileSync("./config.json", text); 
  }
}

function validateConfig(config) {
  if (!config.neurai_password) {
    throw new Error(PROMPT_USER_TO_UPDATE_MESSAGE);
  }
}
