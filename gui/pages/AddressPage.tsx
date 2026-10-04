import * as React from "react";
import type { AddressHistory, AddressSummary, HistoryItem, MovedAmount, Paged, Price, Utxo } from "../api/types";
import { useApi } from "../hooks/useApi";
import { amountSign, usdValue } from "../lib/amount";
import { formatDateTime, formatNumber, middleEllipsis, plural } from "../lib/format";
import { getSearchParam, paths, setSearchParams } from "../lib/route";
import { AmountText, AssetTypeIcon, BigAmount, PendingChip } from "../components/domain";
import { BalanceChart } from "../components/charts";
import { IconFlame, IconIncoming, IconOutgoing, IconQr, IconReturn } from "../components/Icons";
import { QrDialog } from "../components/QrDialog";
import {
  Breadcrumb,
  Card,
  CardSkeleton,
  Chip,
  CopyButton,
  DetailGrid,
  EmptyState,
  ErrorState,
  ListRow,
  Pager,
  RelativeTime,
  Segmented,
  SkeletonRows,
  useDocumentTitle,
} from "../components/ui";

const PAGE = 25;
type Filter = "all" | "xna" | "assets";

function readPage(name: string): number {
  return Math.max(1, parseInt(getSearchParam(name) || "1", 10) || 1);
}

/** The amount a history row is about: XNA when it moved, else the first asset */
function headline(assets: MovedAmount[]): MovedAmount | null {
  const nonZero = assets.filter((a) => amountSign(a.amount) !== 0);
  const xna = nonZero.find((a) => a.asset === "XNA");
  const asset = nonZero.find((a) => a.asset !== "XNA");
  //A transfer of an asset also pays a small XNA fee: the asset is the story
  if (asset && (!xna || amountSign(xna.amount) < 0)) return asset;
  return xna || asset || null;
}

function HistoryRow({ item, address, pending = false }: { item: { txid: string; time: number | null; height?: number; assets: MovedAmount[] }; address: string; pending?: boolean }) {
  const main = headline(item.assets);
  const sign = main ? amountSign(main.amount) : 0;
  const others = item.assets.filter((a) => a !== main && amountSign(a.amount) !== 0);
  const verb = sign > 0 ? "Received" : sign < 0 ? "Sent" : "Moved";
  return (
    <ListRow
      href={paths.tx(item.txid, address)}
      iconClassName={sign > 0 ? "border-transparent bg-ok-soft text-ok" : sign < 0 ? "border-transparent bg-bad-soft text-bad" : undefined}
      icon={sign > 0 ? <IconIncoming size={18} /> : sign < 0 ? <IconOutgoing size={18} /> : <IconReturn size={18} />}
      title={
        <>
          {verb}
          {main && main.asset !== "XNA" ? " " + main.asset : ""}
        </>
      }
      titleExtra={pending ? <PendingChip /> : undefined}
      detail={
        <>
          {pending ? "unconfirmed" : "block #" + formatNumber(item.height ?? 0)}
          {item.time ? (
            <>
              {" · "}
              <RelativeTime time={item.time} />
            </>
          ) : null}
          {others.length > 0 && " · +" + plural(others.length, "more asset", "more assets")}
        </>
      }
      value={main ? <AmountText value={main.amount} signed asset={main.asset === "XNA" ? "XNA" : undefined} /> : "—"}
      sub={<span className="font-mono">{middleEllipsis(item.txid, 6, 6)}</span>}
    />
  );
}

function History({ address }: { address: string }) {
  const [page, setPage] = React.useState(() => readPage("page"));
  const [filter, setFilter] = React.useState<Filter>(() => {
    const value = getSearchParam("filter");
    return value === "xna" || value === "assets" ? value : "all";
  });
  const history = useApi<AddressHistory>(
    `/api/addresses/${encodeURIComponent(address)}/history?page=${page}&size=${PAGE}&filter=${filter}`,
    { refreshMs: page === 1 ? 20000 : undefined }
  );

  const changePage = (value: number) => {
    setPage(value);
    setSearchParams({ page: value > 1 ? value : null });
    document.getElementById("address-history")?.scrollIntoView({ block: "start" });
  };
  const changeFilter = (value: Filter) => {
    setFilter(value);
    setPage(1);
    setSearchParams({ filter: value === "all" ? null : value, page: null });
  };

  const data = history.data;
  return (
    <Card
      flush
      id="address-history"
      title={
        <>
          Activity {data && <span className="ml-1 font-normal text-subtle tabular-nums">{formatNumber(data.total)}</span>}
        </>
      }
      action={
        <Segmented<Filter>
          label="Show"
          value={filter}
          onChange={changeFilter}
          options={[
            { value: "all", label: "All" },
            { value: "xna", label: "XNA" },
            { value: "assets", label: "Assets" },
          ]}
          className="w-auto"
        />
      }
    >
      {history.error && !data ? (
        <ErrorState title="Could not load the history" error={history.error} onRetry={history.reload} />
      ) : !data ? (
        <SkeletonRows rows={6} />
      ) : data.items.length === 0 && data.pending.length === 0 ? (
        <EmptyState title={filter === "all" ? "No activity yet" : "Nothing of this kind"}>
          {filter === "all" ? "Transactions to and from this address will appear here." : "Try another filter."}
        </EmptyState>
      ) : (
        <>
          {data.pending.map((item) => (
            <HistoryRow key={"p" + item.txid} item={item} address={address} pending />
          ))}
          {data.items.map((item: HistoryItem) => (
            <HistoryRow key={item.txid} item={item} address={address} />
          ))}
          <Pager page={data.page} pages={data.pages} onPage={changePage} />
        </>
      )}
    </Card>
  );
}

function Utxos({ address }: { address: string }) {
  const [page, setPage] = React.useState(1);
  const utxos = useApi<Paged<Utxo>>(`/api/addresses/${encodeURIComponent(address)}/utxos?page=${page}&size=10`);
  const data = utxos.data;
  return (
    <Card
      flush
      title={
        <>
          Unspent outputs {data && <span className="ml-1 font-normal text-subtle tabular-nums">{formatNumber(data.total)}</span>}
        </>
      }
      action={
        <a href={"/api/getaddressutxos/" + encodeURIComponent(address)} target="_blank" rel="noopener" className="py-1.5 text-xs font-semibold">
          JSON
        </a>
      }
    >
      {utxos.error && !data ? (
        <ErrorState title="Could not load the unspent outputs" error={utxos.error} onRetry={utxos.reload} />
      ) : !data ? (
        <SkeletonRows rows={3} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Nothing left to spend" />
      ) : (
        <>
          {data.items.map((utxo) => (
            <ListRow
              key={utxo.txid + ":" + utxo.index}
              href={paths.tx(utxo.txid, address)}
              icon={utxo.asset === "XNA" ? <span className="text-[11px] font-bold">XNA</span> : <AssetTypeIcon type="main" />}
              title={<AmountText value={utxo.amount} asset={utxo.asset} />}
              detail={<span className="font-mono">{middleEllipsis(utxo.txid, 8, 6) + ":" + utxo.index}</span>}
              value={utxo.confirmations ? formatNumber(utxo.confirmations) : "—"}
              sub={utxo.confirmations ? "confirmations" : "unconfirmed"}
            />
          ))}
          <Pager page={data.page} pages={data.pages} onPage={setPage} previousLabel="Previous" nextLabel="Next" />
        </>
      )}
    </Card>
  );
}

export function AddressPage({ address }: { address: string }) {
  const summary = useApi<AddressSummary>("/api/addresses/" + encodeURIComponent(address), { refreshMs: 20000 });
  const chart = useApi<AddressHistory>(`/api/addresses/${encodeURIComponent(address)}/history?page=1&size=1`);
  const price = useApi<Price | null>("/api/price");
  const [qr, setQr] = React.useState(false);
  useDocumentTitle("Address " + middleEllipsis(address, 6, 6));

  const crumbs = <Breadcrumb items={[{ label: "Home", href: paths.home() }, { label: "Address" }]} />;

  if (summary.error && !summary.data) {
    return (
      <>
        {crumbs}
        <Card>
          {summary.error.status === 400 ? (
            <EmptyState title="Not an address">{summary.error.message}</EmptyState>
          ) : (
            <ErrorState title="Could not load the address" error={summary.error} onRetry={summary.reload} />
          )}
        </Card>
      </>
    );
  }
  const data = summary.data;
  if (!data) {
    return (
      <>
        {crumbs}
        <CardSkeleton lines={4} />
      </>
    );
  }

  const usd = price.data ? usdValue(data.balance, price.data.usd) : null;
  const points = chart.data?.chart || [];

  return (
    <>
      {crumbs}
      <section className="neurai-card flex flex-col gap-5 px-4 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="nx-eyebrow mr-1">Address</p>
            <Chip>{data.familyLabel}</Chip>
            {data.burn && (
              <Chip tone="warn" title="Coins sent here can never be spent">
                <IconFlame size={12} />
                Burn address
              </Chip>
            )}
          </div>
          <h1 className="m-0 flex min-w-0 items-start gap-1.5 sm:items-center">
            <span className="min-w-0 flex-1 font-mono text-sm leading-normal font-semibold break-all sm:text-[17px]">{data.address}</span>
            <CopyButton value={data.address} label="Copy address" className="border border-base-300 bg-sunken" />
            <button type="button" onClick={() => setQr(true)} className="nx-icon-btn h-10 w-10 sm:h-8 sm:w-8" aria-label="Show QR code" title="Show QR code">
              <IconQr size={16} />
            </button>
          </h1>
        </div>

        <div>
          <p className="nx-eyebrow">Balance</p>
          <div className="mt-2">
            <BigAmount value={data.balance} asset="XNA" />
          </div>
          {(usd || data.pending.length > 0) && (
            <p className="m-0 mt-1.5 flex flex-wrap gap-x-3 text-sm text-muted">
              {usd && <span className="tabular-nums">≈ {usd}</span>}
              {data.pending.map((p) => (
                <span key={p.asset} className="inline-flex items-center gap-1.5">
                  <PendingChip />
                  <AmountText value={p.amount} asset={p.asset} signed />
                </span>
              ))}
            </p>
          )}
        </div>

        <DetailGrid
          items={[
            { label: "Received", value: <AmountText value={data.received} asset="XNA" short /> },
            { label: "Sent", value: <AmountText value={data.sent} asset="XNA" short /> },
            { label: "Transactions", value: formatNumber(data.txCount) },
            {
              label: "Active",
              value: data.last ? <RelativeTime time={data.last.time} /> : "Never",
              sub: data.first ? "first seen " + (data.first.time ? formatDateTime(data.first.time).slice(0, 10) : "#" + formatNumber(data.first.height)) : undefined,
            },
          ]}
        />
      </section>

      <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr]">
        <div className="order-2 min-w-0 lg:order-1 lg:row-span-3">
          <History address={data.address} />
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          <Card flush title={<>Assets <span className="ml-1 font-normal text-subtle tabular-nums">{data.assets.length}</span></>}>
            {data.assets.length === 0 ? (
              <p className="m-0 border-t border-base-300 px-4 py-4 text-sm text-subtle sm:px-[18px]">No assets, only XNA.</p>
            ) : (
              data.assets.map((asset) => (
                <ListRow
                  key={asset.name}
                  href={paths.asset(asset.name)}
                  icon={<AssetTypeIcon type={asset.type} />}
                  title={asset.name}
                  value={<AmountText value={asset.balance} />}
                />
              ))
            )}
          </Card>
        </div>

        {points.length >= 2 && (
          <div className="order-3 min-w-0 lg:order-3">
            <Card>
              <BalanceChart points={points} />
            </Card>
          </div>
        )}

        <div className="order-4 min-w-0">
          <Utxos address={data.address} />
        </div>
      </div>

      <QrDialog value={data.address} open={qr} onClose={() => setQr(false)} />
    </>
  );
}
