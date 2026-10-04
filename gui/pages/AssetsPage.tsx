import * as React from "react";
import type { AssetList, AssetListItem, AssetType } from "../api/types";
import { useApi } from "../hooks/useApi";
import { formatShortAmount } from "../lib/amount";
import { formatNumber } from "../lib/format";
import { getSearchParam, paths, setSearchParams } from "../lib/route";
import { AssetAvatar, AssetTypeIcon } from "../components/domain";
import { IconSearch } from "../components/Icons";
import { Breadcrumb, Card, EmptyState, ErrorState, ListRow, Pager, Segmented, Skeleton, SkeletonRows, useDocumentTitle } from "../components/ui";

const PAGE = 24;
type TypeFilter = "all" | AssetType;
type Sort = "name" | "newest";

const TYPES: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "main", label: "Main" },
  { value: "sub", label: "Sub-assets" },
  { value: "unique", label: "Unique" },
  { value: "qualifier", label: "Qualifiers" },
  { value: "restricted", label: "Restricted" },
  { value: "depin", label: "DePIN" },
  { value: "channel", label: "Channels" },
];

function holdersText(asset: AssetListItem): string {
  if (asset.holders === null) return "holders unknown";
  return formatNumber(asset.holders) + (asset.holders === 1 ? " holder" : " holders");
}

function AssetCard({ asset }: { asset: AssetListItem }) {
  return (
    <a
      href={paths.asset(asset.name)}
      className="nx-inset flex min-w-0 flex-col gap-3 p-4 text-base-content no-underline transition-colors hover:border-accent-line hover:bg-accent hover:no-underline"
    >
      <div className="flex min-w-0 items-center gap-3">
        <AssetAvatar name={asset.name} hasIpfs={asset.hasIpfs} size={44} />
        <div className="min-w-0">
          <span className="block truncate font-semibold" title={asset.name}>
            {asset.name}
          </span>
          <span className="flex items-center gap-1 text-xs text-subtle">
            <AssetTypeIcon type={asset.type} size={12} />
            {asset.typeLabel}
          </span>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-2 text-xs">
        <div className="min-w-0">
          <dt className="text-subtle">Supply</dt>
          <dd className="m-0 truncate text-sm font-semibold tabular-nums">{formatShortAmount(asset.amount)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-subtle">Holders</dt>
          <dd className="m-0 text-sm font-semibold tabular-nums">{asset.holders === null ? "—" : formatNumber(asset.holders)}</dd>
        </div>
      </dl>
      <span className="text-xs text-subtle">
        {asset.height !== null ? "Issued in block #" + formatNumber(asset.height) : ""}
        {asset.reissuable ? " · reissuable" : ""}
      </span>
    </a>
  );
}

export function AssetsPage() {
  useDocumentTitle("Assets");
  const [input, setInput] = React.useState(() => getSearchParam("q") || "");
  const [query, setQuery] = React.useState(() => getSearchParam("q") || "");
  const [type, setType] = React.useState<TypeFilter>(() => (getSearchParam("type") as TypeFilter) || "all");
  const [sort, setSort] = React.useState<Sort>(() => (getSearchParam("sort") === "newest" ? "newest" : "name"));
  const [page, setPage] = React.useState(() => Math.max(1, parseInt(getSearchParam("page") || "1", 10) || 1));

  //Search as the user types, a moment after the last key
  React.useEffect(() => {
    if (input === query) return;
    const timer = setTimeout(() => {
      setQuery(input);
      setPage(1);
      setSearchParams({ q: input.trim() || null, page: null });
    }, 300);
    return () => clearTimeout(timer);
  }, [input, query]);

  const params = new URLSearchParams({ page: String(page), size: String(PAGE), sort });
  if (query.trim()) params.set("q", query.trim());
  if (type !== "all") params.set("type", type);
  const list = useApi<AssetList>("/api/assets?" + params.toString());
  const data = list.data;

  const options = TYPES.filter((t) => t.value === "all" || t.value === type || (data?.counts[t.value] ?? 0) > 0).map((t) => ({
    ...t,
    count: data?.counts[t.value] ?? undefined,
  }));

  const changePage = (value: number) => {
    setPage(value);
    setSearchParams({ page: value > 1 ? value : null });
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: paths.home() }, { label: "Assets" }]} />
      <Card flush>
        <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:px-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="m-0 text-lg font-bold">
              Assets {data && <span className="ml-1 text-base font-normal text-subtle tabular-nums">{formatNumber(data.counts.all ?? data.total)}</span>}
            </h1>
            <Segmented<Sort>
              label="Sort"
              value={sort}
              onChange={(value) => {
                setSort(value);
                setPage(1);
                setSearchParams({ sort: value === "name" ? null : value, page: null });
              }}
              options={[
                { value: "name", label: "Name" },
                { value: "newest", label: "Newest" },
              ]}
              className="w-auto"
            />
          </div>
          <form aria-label="Filter assets" onSubmit={(event) => event.preventDefault()} className="relative">
            <label htmlFor="asset-search" className="nx-visually-hidden">
              Filter assets by name
            </label>
            <IconSearch size={18} className="pointer-events-none absolute top-[13px] left-3.5 text-subtle" />
            <input
              id="asset-search"
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Filter by name"
              className="h-11 w-full rounded-[10px] border border-base-300 bg-sunken pr-3 pl-[42px] text-base outline-none focus:border-brand sm:text-sm"
            />
          </form>
          <Segmented<TypeFilter>
            label="Type"
            value={type}
            onChange={(value) => {
              setType(value);
              setPage(1);
              setSearchParams({ type: value === "all" ? null : value, page: null });
            }}
            options={options}
          />
        </div>

        {list.error && !data ? (
          <ErrorState title="Could not load the assets" error={list.error} onRetry={list.reload} />
        ) : !data ? (
          <>
            <div className="md:hidden">
              <SkeletonRows rows={6} />
            </div>
            <div className="hidden gap-3 border-t border-base-300 p-[18px] md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-[150px] rounded-[10px]" />
              ))}
            </div>
          </>
        ) : data.items.length === 0 ? (
          <div className="border-t border-base-300">
            <EmptyState title="No assets match">
              {query ? <>Nothing is named like “{query}”. Asset names are upper case, but the filter ignores case.</> : "Try another type."}
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="md:hidden">
              {data.items.map((asset) => (
                <ListRow
                  key={asset.name}
                  href={paths.asset(asset.name)}
                  icon={<AssetAvatar name={asset.name} hasIpfs={asset.hasIpfs} size={36} />}
                  iconClassName="border-0 bg-transparent"
                  title={asset.name}
                  detail={asset.typeLabel + " · " + holdersText(asset)}
                  value={formatShortAmount(asset.amount)}
                  sub="supply"
                />
              ))}
            </div>
            <div className="hidden gap-3 border-t border-base-300 p-[18px] md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((asset) => (
                <AssetCard key={asset.name} asset={asset} />
              ))}
            </div>
            <Pager page={data.page} pages={data.pages} onPage={changePage} previousLabel="Previous" nextLabel="Next" />
          </>
        )}
      </Card>
    </>
  );
}
