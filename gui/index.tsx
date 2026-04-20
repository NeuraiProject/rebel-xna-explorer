import * as React from "react";
import { createRoot } from "react-dom/client";
import { Address } from "./address/Address";

import { Blocks } from "./Blocks";
import Routes from "./Routes";
import { getParam } from "./getParam";
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
  [Routes.TRANSACTION]: <Transaction />,
  [Routes.ASSETS]: <Assets />,
  [Routes.ASSET]: <Asset />,
};

function CurrentView({ route }) {
  return views[route];
}
function App() {
  const [route, setRoute] = React.useState<string | null>(null);

  const runOnce = [];
  React.useEffect(() => {
    const route = getParam("route");
    if (!route) {
      setRoute(Routes.HOME); //Default to HOME
    } else {
      setRoute(route);
    }
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
