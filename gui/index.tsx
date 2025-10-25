import * as React from "react";
import { createRoot } from "react-dom/client";
import { Address } from "./address/Address";

import { Blocks } from "./Blocks";
import Routes from "./Routes";
import { getParam } from "./getParam";
import { Block } from "./Block";
import { Navigator } from "./Navigator";
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
    <div>
      <Navigator />
      {<CurrentView route={route}></CurrentView>}
      <Spacer></Spacer>
      <Footer></Footer>
    </div>
  );
}

function Footer() {
  return (
    <div>
      <Text size={12}>
        Nurai Rebel Explorer = Software from{" "}
        <a href="https://twitter.com/neuraiproject">Neuraiproject</a>
      </Text>
    </div>
  );
}
//Render the app
const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
