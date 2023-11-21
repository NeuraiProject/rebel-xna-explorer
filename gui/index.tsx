import * as React from "react";
import { createRoot } from "react-dom/client";
import { Address } from "./Address";

import { Blocks } from "./Blocks";
import Routes from "./Routes";
import { getParam } from "./getParam";
import { Block } from "./Block";
import { Navigator } from "./Navigator";
import { NextUIProvider, Text } from "@nextui-org/react";

import { createTheme } from "@nextui-org/react";
import { Transaction } from "./transaction/Transaction";
import { Assets } from "./Assets";
import { Asset } from "./Asset";
import axios from "axios";

const darkTheme = createTheme({
  type: "dark",
});
const lightTheme = createTheme({
  type: "light",
});

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
  const [theme, setTheme] = React.useState(darkTheme);
  const [route, setRoute] = React.useState<string | null>(null);

  const runOnce = [];
  React.useEffect(() => {
    const route = getParam("route");
    if (!route) {
      setRoute(Routes.HOME); //Default to HOME
    } else {
      setRoute(route);
    }

    //Set theme
    axios.get("/gui-settings").then((response) => {
      const themes = {
        dark: darkTheme,
        light: lightTheme,
      };

      const theme = themes[response.data.theme];
      setTheme(theme);
    });
  }, runOnce);

  if (route === null) {
    return null;
  }

  return (
    <NextUIProvider theme={theme}>
      <Navigator />
      {<CurrentView route={route}></CurrentView>}
      <Footer></Footer>
    </NextUIProvider>
  );
}

function Footer() {
  return (
    <div>
      <Text size={12}>
        Rebel Explorer = Software from{" "}
        <a href="https://twitter.com/RavenRebels">Raven Rebels</a>
      </Text>
    </div>
  );
}
//Render the app
const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
