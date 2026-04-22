import * as React from "react";
import { createRoot } from "react-dom/client";
import { Address } from "./address/Address";

import { Blocks } from "./Blocks";
import Routes from "./Routes";
import { Block } from "./Block";
import { Navigator, SearchBar } from "./Navigator";
import { Spacer, Text } from "./components";

import { Transaction } from "./transaction/Transaction";
import { Assets } from "./Assets";
import { Asset } from "./Asset";

const views = {
  [Routes.HOME]: <Blocks />,
  [Routes.BLOCKS]: <Blocks />,
  [Routes.ADDRESS]: <Address />,
  [Routes.BLOCK]: <Block />,
  [Routes.BLOCKHASH]: <Block />,
  [Routes.TRANSACTION]: <Transaction />,
  [Routes.ASSETS]: <Assets />,
  [Routes.ASSET]: <Asset />,
};

function resolveRoute(): string {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return Routes.HOME;
  switch (segments[0]) {
    case "block":
      return Routes.BLOCK;
    case "blockhash":
      return Routes.BLOCKHASH;
    case "tx":
      return Routes.TRANSACTION;
    case "address":
      return Routes.ADDRESS;
    case "asset":
      return Routes.ASSET;
    case "assets":
      return Routes.ASSETS;
    default:
      return Routes.HOME;
  }
}

function CurrentView({ route }) {
  return views[route];
}
function App() {
  const [route, setRoute] = React.useState<string | null>(null);

  const runOnce = [];
  React.useEffect(() => {
    setRoute(resolveRoute());
  }, runOnce);

  if (route === null) {
    return null;
  }

  return (
    <div className="app-shell">
      <Navigator />
      <div className="content-container">
        <SearchBar />
        <Spacer />
        <CurrentView route={route}></CurrentView>
      </div>
      <Footer></Footer>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>
        © 2026 Neurai ·{" "}
        <a href="https://neurai.org" target="_blank" rel="noopener">
          neurai.org
        </a>
      </p>
    </footer>
  );
}
//Render the app
const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
