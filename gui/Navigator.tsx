import * as React from "react";
import axios from "axios";
import { Input } from "./components";
import { MyCard } from "./MyCard";
import logoUrl from "./logo.png";

type Theme = "light" | "dark";

//Only a theme the user picked with the toggle is saved
function getSavedTheme(): Theme | null {
  const saved = localStorage.getItem("theme");
  return saved === "light" || saved === "dark" ? saved : null;
}

const NETWORK_LABELS: { [chain: string]: string } = {
  main: "Mainnet",
  test: "Testnet",
  regtest: "Regtest",
};

export function Navigator() {
  const [headline, setHeadline] = React.useState("");
  const [network, setNetwork] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState<boolean | null>(null);
  const [theme, setTheme] = React.useState<Theme>(
    () => getSavedTheme() || "light"
  );

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  React.useEffect(() => {
    axios
      .get("/gui-settings")
      .then((response) => {
        const settings = response.data;
        setHeadline(settings.headline || "");
        setNetwork(settings.network || null);
        //The configured theme is the default until the user picks one
        if (
          !getSavedTheme() &&
          (settings.theme === "light" || settings.theme === "dark")
        ) {
          setTheme(settings.theme);
        }
      })
      .catch((e) => console.dir(e));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        await axios.get("/api/bestblock", { timeout: 5000 });
        if (!cancelled) setOnline(true);
      } catch {
        if (!cancelled) setOnline(false);
      }
    }
    check();
    const interval = setInterval(check, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  //The node tells the chain; the headline is only a fallback while it is unknown
  const networkLabel =
    (network && NETWORK_LABELS[network]) ||
    (/mainnet/i.test(headline) ? "Mainnet" : "Testnet");

  return (
    <nav className="navbar">
      <a href="/" className="navbar-left navbar-home">
        <img src={logoUrl} alt="Neurai Logo" className="nav-logo" />
        <div className="nav-title-group">
          <span className="nav-eyebrow">EXPLORER</span>
          <span className="nav-title">Rebel Explorer</span>
        </div>
      </a>
      <div className="navbar-right">
        <div
          className="network-pill"
          title={
            online === null
              ? "Checking RPC…"
              : online
                ? "RPC connected"
                : "RPC unreachable"
          }
        >
          <span
            className="dot"
            style={{
              background:
                online === null
                  ? "#9ca3af"
                  : online
                    ? "#22c55e"
                    : "#ef4444",
            }}
          />
          <span>{networkLabel}</span>
        </div>
        <a href="/assets" className="nav-btn">
          Assets
        </a>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle dark/light mode"
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}

export function SearchBar() {
  const [query, setQuery] = React.useState("");

  const search = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    axios
      .get("/gettype/" + encodeURIComponent(value))
      .then((response) => {
        const encodedValue = encodeURIComponent(value);
        if (response.data.type === "BLOCK") {
          const path = value.length > 15 ? "/blockhash/" : "/block/";
          window.location.href = path + encodedValue;
        }
        if (response.data.type === "TRANSACTION") {
          window.location.href = "/tx/" + encodedValue;
        }
        if (response.data.type === "ADDRESS") {
          window.location.href = "/address/" + encodedValue;
        }
        if (response.data.type === "ASSET") {
          window.location.href =
            "/asset/" + encodeURIComponent(response.data.name);
        }
        if (response.data.type === "UNKNOWN") {
          alert("Sorry, do not know what to do with " + value);
        }
      })
      .catch(() => alert("Sorry, the search failed, try again later"));
  };

  const body = (
    <form className="d-flex" role="search" onSubmit={search} style={{ width: "100%" }}>
      <Input
        size="xl"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Address / transaction / block id / asset"
      />
    </form>
  );

  return <MyCard header="Search" body={body} />;
}
