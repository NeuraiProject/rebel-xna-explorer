import { NETWORK_LABELS, useSettings } from "../hooks/useSettings";

export function Footer() {
  const settings = useSettings();
  const network = settings?.network ? NETWORK_LABELS[settings.network] : null;
  return (
    <footer className="nx-prose mt-auto flex flex-col items-center gap-1 px-1 pt-2 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
      <span>
        © {new Date().getFullYear()} Neurai ·{" "}
        <a href="https://neurai.org" target="_blank" rel="noopener">
          neurai.org
        </a>
      </span>
      <span>
        Rebel Explorer{settings?.version ? " v" + settings.version : ""}
        {network ? " · " + network : ""}
      </span>
    </footer>
  );
}
