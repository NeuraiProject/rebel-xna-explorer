import * as React from "react";
import type { Settings } from "../api/types";
import { getJson } from "./useApi";

//Asked once per page load and shared by everyone who needs it
let settingsPromise: Promise<Settings> | null = null;

export function loadSettings(): Promise<Settings> {
  if (!settingsPromise) {
    settingsPromise = getJson<Settings>("/gui-settings");
    settingsPromise.catch(() => {
      settingsPromise = null;
    });
  }
  return settingsPromise;
}

export function useSettings(): Settings | null {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    loadSettings()
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return settings;
}

export const NETWORK_LABELS: Record<string, string> = {
  main: "Mainnet",
  test: "Testnet",
  regtest: "Regtest",
};
