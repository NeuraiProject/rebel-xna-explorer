# Rebel Explorer
An blockchain explorer for Neurai
![image](https://user-images.githubusercontent.com/9694984/218311548-93d3dd3c-e606-478c-85fa-635f013ed278.png)

## Before you install
- You need to have Node.js and Git installed.

- You can run the Explorer and use an online Ravencoin RPC service such as
   * https://rpc-main.neurai.org click on mainnet or testnet to find the endpoints.

- The idea is that you run your own Neurai node.
The node needs to be fully indexed and your neurai.conf must include
    * txindex=1
    * addressindex=1
    * assetindex=1
    * timestampindex=1
    * spentindex=1

## How to install
Clone the git repo

Run `npm install`

Run `npm run build`

## How to start

Run `npm start`
### Configuration

The first time you try to start the Explorer, a config.json file will be created.
Update the config.json file with your information and restart restart the node.js app
```
{
    "raven_password": "anonymous",
    "raven_username": "anonymous",
    "raven_url": "https://rpc-main.neurai.org/rpc",
    "httpPort": 8888,
    "headline": "Neurai mainnet",
    "theme": "dark",
    "ipfs_gateway": "https://cloudflare-ipfs.com/ipfs/"
}
```

The attributes "headline" and "theme" are used for the graphical user interface. Config is only read once at startup, so you need to restart the app if you change config. 

## Do changes
If you change the graphical user interface (gui folder), you can 
- run `npm run build`
or
- `npm run dev` this is a watcher that will listen for changes

 







