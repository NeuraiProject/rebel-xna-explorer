import * as React from "react";
import logoUrl from "../logo.png";
import { getJson, useApi } from "../hooks/useApi";
import { NETWORK_LABELS, useSettings } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";
import { paths, type Route } from "../lib/route";
import { IconActivity, IconAlert, IconBlock, IconHome, IconMoon, IconSearch, IconSun, IconTag, IconX } from "../components/Icons";
import { cx } from "../components/ui";

const NAV = [
  { key: "home", label: "Home", href: paths.home(), icon: IconHome, routes: ["home"] },
  { key: "blocks", label: "Blocks", href: paths.blocks(), icon: IconBlock, routes: ["blocks", "block"] },
  { key: "assets", label: "Assets", href: paths.assets(), icon: IconTag, routes: ["assets", "asset"] },
  { key: "mempool", label: "Mempool", href: paths.mempool(), icon: IconActivity, routes: ["mempool"] },
];

type SearchResult = { type: "BLOCK" | "TRANSACTION" | "ADDRESS" | "ASSET" | "UNKNOWN"; name?: string };

//Where a search answer leads, or null when nothing matched
function searchTarget(value: string, result: SearchResult): string | null {
  switch (result.type) {
    case "BLOCK":
      return paths.block(value);
    case "TRANSACTION":
      return paths.tx(value);
    case "ADDRESS":
      return paths.address(value);
    case "ASSET":
      return paths.asset(result.name || value);
    default:
      return null;
  }
}

function useSearch() {
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await getJson<SearchResult>("/gettype/" + encodeURIComponent(value));
      const target = searchTarget(value, result);
      if (target) {
        window.location.href = target;
        return;
      }
      setMessage(`Nothing found for “${value}”. Search by block height, block hash, transaction id, address or asset name.`);
    } catch (e: any) {
      setMessage("The search failed: " + (e?.message || "try again in a moment") + ".");
    }
    setBusy(false);
  };

  return { query, setQuery, busy, message, clear: () => setMessage(null), submit };
}

export function Header({ route }: { route: Route }) {
  const settings = useSettings();
  const [theme, toggleTheme] = useTheme();
  const tip = useApi<{ height: number }>("/api/bestblock", { refreshMs: 15000 });
  const search = useSearch();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const desktopInput = React.useRef<HTMLInputElement>(null);
  const mobileInput = React.useRef<HTMLInputElement>(null);

  //"/" jumps to the search box, unless the user is typing somewhere already
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      if (desktopInput.current && desktopInput.current.offsetParent !== null) {
        desktopInput.current.focus();
      } else {
        setSearchOpen(true);
        setTimeout(() => mobileInput.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const online = tip.error ? false : tip.data ? true : null;
  const network = settings?.network || null;
  const networkLabel = (network && NETWORK_LABELS[network]) || (settings ? "Network" : "…");
  const tone = network === "main" ? "ok" : network === "test" ? "bad" : "neutral";
  const status = online === null ? "Checking the node…" : online ? "Node connected" : "Node unreachable";

  const isDark = theme === "dark";
  const themeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  const searchInput = (ref: React.Ref<HTMLInputElement>, id: string, className: string, placeholder: string) => (
    <>
      <label htmlFor={id} className="nx-visually-hidden">
        Search
      </label>
      <input
        ref={ref}
        id={id}
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={search.query}
        onChange={(event) => search.setQuery(event.target.value)}
        placeholder={placeholder}
        className={cx(
          "h-11 w-full min-w-0 rounded-[10px] border border-base-300 bg-sunken text-base-content outline-none transition-colors focus:border-brand",
          className
        )}
      />
    </>
  );

  return (
    <>
      <header className="neurai-card relative px-3.5 pt-3 pb-0 sm:px-5 lg:py-3">
        <span
          title={status}
          className={cx(
            "absolute top-0 right-[104px] z-10 inline-flex select-none items-center gap-1.5 rounded-b-md border border-t-0 px-2.5 py-1 text-[10.5px] leading-none font-bold tracking-[0.08em] uppercase lg:right-24",
            tone === "ok" && "border-ok-line bg-ok-soft text-ok",
            tone === "bad" && "border-bad/40 bg-bad-soft text-bad",
            tone === "neutral" && "border-base-300 bg-sunken text-muted"
          )}
        >
          <span
            aria-hidden="true"
            className={cx("h-1.5 w-1.5 rounded-full", online === false ? "bg-transparent ring-1 ring-current" : "bg-current", online && "nx-pulse")}
          />
          {networkLabel}
          {online === false && <span className="font-semibold normal-case tracking-normal">· offline</span>}
          <span className="nx-visually-hidden">, {status}</span>
        </span>

        <div className="flex min-h-12 items-center gap-2 lg:gap-6">
          <a href={paths.home()} className="flex shrink-0 items-center gap-2.5 text-base-content no-underline hover:no-underline">
            <img src={logoUrl} alt="" className="h-[34px] w-[34px] rounded-full bg-white lg:h-[38px] lg:w-[38px]" />
            <span className="flex flex-col leading-[1.15]">
              <span className="text-[10.5px] font-bold tracking-[0.1em] text-subtle uppercase">Neurai</span>
              <span className="text-base font-bold lg:text-lg">Rebel Explorer</span>
            </span>
          </a>

          <form role="search" aria-label="Search the explorer" onSubmit={search.submit} className="relative hidden max-w-[620px] min-w-0 flex-1 lg:block">
            <IconSearch size={18} className="pointer-events-none absolute top-[13px] left-3.5 text-subtle" />
            {searchInput(desktopInput, "search-desktop", "pr-12 pl-[42px] text-sm", "Search block, transaction, address or asset")}
            {search.busy ? (
              <span className="loading loading-spinner loading-sm absolute top-3 right-3 text-subtle" aria-label="Searching" />
            ) : (
              <kbd className="absolute top-[11px] right-3 inline-grid h-[22px] min-w-5 place-items-center rounded-md border border-base-300 bg-base-200 px-1.5 font-mono text-xs text-subtle">
                /
              </kbd>
            )}
          </form>

          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const current = item.routes.includes(route.name);
              return (
                <a
                  key={item.key}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "rounded-lg px-3.5 py-2.5 text-sm font-semibold no-underline hover:no-underline",
                    current ? "bg-accent text-link" : "text-muted hover:bg-sunken hover:text-base-content"
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <span className="flex-1 lg:hidden" />
          <button
            type="button"
            className="nx-icon-btn lg:hidden"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((open) => !open);
              setTimeout(() => mobileInput.current?.focus(), 0);
            }}
          >
            <IconSearch size={18} />
          </button>
          <button type="button" className="nx-icon-btn" aria-label={themeLabel} title={themeLabel} onClick={toggleTheme}>
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
        </div>

        {searchOpen && (
          <form role="search" aria-label="Search the explorer" onSubmit={search.submit} className="mt-2.5 flex gap-2 lg:hidden">
            {searchInput(mobileInput, "search-mobile", "px-3.5 text-base", "Block, tx, address or asset")}
            <button type="submit" className="neurai-btn--primary h-11 min-h-11 px-4" disabled={search.busy}>
              {search.busy ? <span className="loading loading-spinner loading-sm" aria-label="Searching" /> : "Go"}
            </button>
          </form>
        )}

        {menuOpen && (
          <nav aria-label="Main" className="grid grid-cols-4 gap-1.5 pt-3 lg:hidden">
            {NAV.map((item) => {
              const current = item.routes.includes(route.name);
              const Icon = item.icon;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "flex flex-col items-center gap-1 rounded-[10px] px-1 py-2.5 text-xs font-semibold no-underline hover:no-underline",
                    current ? "bg-accent text-link" : "text-muted hover:bg-sunken"
                  )}
                >
                  <Icon size={20} />
                  {item.label}
                </a>
              );
            })}
          </nav>
        )}

        {/* The wallet's handle: three thin lines on the card's bottom edge open the menu */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Hide menu" : "Show menu"}
          className="-mx-3.5 mt-1.5 flex w-[calc(100%+28px)] cursor-pointer flex-col items-center gap-[3px] rounded-b-xl border-0 bg-transparent pt-2.5 pb-2 text-subtle transition-colors hover:text-link sm:-mx-5 sm:w-[calc(100%+40px)] lg:hidden"
        >
          <span aria-hidden="true" className="block h-0.5 w-7 rounded-full bg-current" />
          <span aria-hidden="true" className="block h-0.5 w-7 rounded-full bg-current" />
          <span aria-hidden="true" className="block h-0.5 w-7 rounded-full bg-current" />
        </button>
      </header>

      {search.message && (
        <div role="status" className="flex items-start gap-2.5 rounded-[10px] border border-warn-line bg-warn-soft px-4 py-3 text-sm text-base-content">
          <IconAlert size={18} className="mt-px shrink-0 text-warn" />
          <span className="min-w-0 flex-1 break-words">{search.message}</span>
          <button type="button" onClick={search.clear} aria-label="Dismiss" className="-my-1.5 -mr-2 grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-subtle hover:text-base-content">
            <IconX size={16} />
          </button>
        </div>
      )}
    </>
  );
}
