import * as React from "react";
import { createRoot } from "react-dom/client";
import { Header } from "./layout/Header";
import { Footer } from "./layout/Footer";
import { resolveRoute, type Route } from "./lib/route";
import { HomePage } from "./pages/HomePage";
import { BlocksPage } from "./pages/BlocksPage";
import { BlockPage } from "./pages/BlockPage";
import { TransactionPage } from "./pages/TransactionPage";
import { AddressPage } from "./pages/AddressPage";
import { AssetsPage } from "./pages/AssetsPage";
import { AssetPage } from "./pages/AssetPage";
import { MempoolPage } from "./pages/MempoolPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function CurrentPage({ route }: { route: Route }) {
  switch (route.name) {
    case "home":
      return <HomePage />;
    case "blocks":
      return <BlocksPage />;
    case "block":
      return <BlockPage id={route.id} />;
    case "tx":
      return <TransactionPage id={route.id} />;
    case "address":
      return <AddressPage address={route.id} />;
    case "assets":
      return <AssetsPage />;
    case "asset":
      return <AssetPage name={route.id} />;
    case "mempool":
      return <MempoolPage />;
    default:
      return <NotFoundPage />;
  }
}

function App() {
  const route = React.useMemo(() => resolveRoute(window.location.pathname), []);
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6">
      <Header route={route} />
      <main className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <CurrentPage route={route} />
      </main>
      <Footer />
    </div>
  );
}

const container = document.getElementById("app");
if (container) {
  createRoot(container).render(<App />);
}
