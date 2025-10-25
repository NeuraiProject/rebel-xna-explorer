import fs from "fs";

const defaultConfig = {
  baseCurrency: "XNA",
  raven_password: "anonymous",
  raven_username: "anonymous",
  raven_url: "https://rpc-main.neurai.top/rpc",
  httpPort: 8888,
  headline: "Neurai Mainnet",
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
  if (!config.raven_password) {
    throw new Error(PROMPT_USER_TO_UPDATE_MESSAGE);
  }
}
