import * as React from "react";
import type { AssetDetail, AssetHolders } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useSettings } from "../hooks/useSettings";
import { formatNumber, formatShare, middleEllipsis } from "../lib/format";
import { paths } from "../lib/route";
import { AmountText, AssetAvatar, AssetBadge } from "../components/domain";
import { IconExternal } from "../components/Icons";
import {
  Breadcrumb,
  Card,
  CardSkeleton,
  Chip,
  DetailGrid,
  EmptyState,
  ErrorState,
  HashText,
  Pager,
  RawJson,
  SkeletonRows,
  useDocumentTitle,
  type Detail,
} from "../components/ui";

const PAGE = 25;

function Holders({ asset }: { asset: AssetDetail }) {
  const [page, setPage] = React.useState(1);
  const holders = useApi<AssetHolders>(`/api/assets/${encodeURIComponent(asset.name)}/holders?page=${page}&size=${PAGE}`);
  const data = holders.data;
  return (
    <Card
      flush
      id="holders"
      title={
        <>
          Holders {asset.holderCount !== null && <span className="ml-1 font-normal text-subtle tabular-nums">{formatNumber(asset.holderCount)}</span>}
        </>
      }
    >
      {holders.error && !data ? (
        <ErrorState title="Could not load the holders" error={holders.error} onRetry={holders.reload} />
      ) : !data ? (
        <SkeletonRows rows={5} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Nobody holds this asset" />
      ) : (
        <>
          <ol className="m-0 list-none p-0">
            {data.items.map((holder) => (
              <li key={holder.address} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-t border-base-300 px-4 py-3 sm:grid-cols-[36px_minmax(0,1fr)_minmax(120px,200px)_auto] sm:px-[18px]">
                <span className="col-start-1 row-start-1 text-right text-xs font-semibold text-subtle tabular-nums">{holder.rank}</span>
                <span className="col-start-2 row-start-1 flex min-w-0 items-center gap-2">
                  <HashText value={holder.address} href={paths.address(holder.address)} head={10} tail={8} responsive plain className="min-w-0 text-[13px]" />
                  {asset.owner && holder.address === asset.owner.address && <Chip tone="accent">Owner</Chip>}
                </span>
                <AmountText value={holder.amount} className="col-start-3 row-start-1 text-right text-[13px] font-semibold sm:col-start-4" />
                <span
                  className="col-span-2 col-start-2 row-start-2 flex items-center gap-2 sm:col-span-1 sm:col-start-3 sm:row-start-1"
                  title={formatShare(holder.share) + " of the supply"}
                >
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-300">
                    <span className="block h-full rounded-full bg-brand" style={{ width: Math.max((holder.share || 0) * 100, 0.5) + "%" }} />
                  </span>
                  <span className="w-14 text-right text-xs text-subtle tabular-nums">{formatShare(holder.share)}</span>
                </span>
              </li>
            ))}
          </ol>
          <Pager
            page={data.page}
            pages={data.pages}
            onPage={(value) => {
              setPage(value);
              document.getElementById("holders")?.scrollIntoView({ block: "start" });
            }}
            previousLabel="Previous"
            nextLabel="Next"
          />
        </>
      )}
    </Card>
  );
}

function Related({ title, names }: { title: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <Card title={<>{title} <span className="ml-1 font-normal text-subtle tabular-nums">{names.length}</span></>}>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {names.map((name) => (
          <li key={name}>
            <AssetBadge name={name} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AssetPage({ name }: { name: string }) {
  const asset = useApi<AssetDetail>("/api/assets/" + encodeURIComponent(name));
  const settings = useSettings();
  const data = asset.data;
  useDocumentTitle(data ? data.name : name);

  const crumbs = (
    <Breadcrumb items={[{ label: "Home", href: paths.home() }, { label: "Assets", href: paths.assets() }, { label: data?.name || name }]} />
  );

  if (asset.error && !data) {
    return (
      <>
        {crumbs}
        <Card>
          {asset.error.status === 404 ? (
            <EmptyState title={asset.error.message}>
              Asset names are upper case, like <a href={paths.asset(name.toUpperCase())}>{name.toUpperCase()}</a>. <a href={paths.assets()}>Browse all assets</a>.
            </EmptyState>
          ) : (
            <ErrorState title="Could not load the asset" error={asset.error} onRetry={asset.reload} />
          )}
        </Card>
      </>
    );
  }
  if (!data) {
    return (
      <>
        {crumbs}
        <CardSkeleton lines={5} />
      </>
    );
  }

  const gateway = settings?.ipfs_gateway || "https://ipfs.io/ipfs/";
  const facts: Detail[] = [
    { label: "Supply", value: <AmountText value={data.amount} /> },
    { label: "Decimals", value: formatNumber(data.units), sub: data.units === 0 ? "whole units only" : "smallest unit " + (1 / 10 ** data.units).toFixed(data.units) },
    { label: "Holders", value: data.holderCount === null ? "—" : formatNumber(data.holderCount) },
    { label: "Supply can grow", value: data.reissuable ? "Yes" : "No", sub: data.reissuable ? "the owner can reissue" : "fixed for ever" },
    {
      label: "Issued in block",
      value: data.height !== null ? <a href={paths.block(data.height)}>#{formatNumber(data.height)}</a> : "—",
      sub: data.issueTxid ? (
        <>
          tx <a href={paths.tx(data.issueTxid)} className="font-mono">{middleEllipsis(data.issueTxid, 8, 6)}</a>
        </>
      ) : undefined,
    },
  ];
  if (data.parent) {
    facts.push({ label: "Belongs to", value: <AssetBadge name={data.parent} /> });
  }
  if (data.owner) {
    facts.push({
      label: "Owner",
      value: <HashText value={data.owner.address} href={paths.address(data.owner.address)} responsive head={12} tail={8} copy="Copy owner address" />,
      sub: "holds " + data.name + "!, the token that controls the asset",
      wide: true,
    });
  }
  if (data.ipfsHash) {
    facts.push({
      label: "IPFS",
      value: (
        <a href={gateway + data.ipfsHash} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-mono break-all">
          {data.ipfsHash}
          <IconExternal size={14} className="shrink-0" />
        </a>
      ),
      wide: true,
    });
  }

  return (
    <>
      {crumbs}
      <section className="neurai-card flex flex-col gap-5 px-4 py-5 sm:px-7 sm:py-6">
        <div className="flex min-w-0 items-center gap-4">
          {data.hasIpfs ? (
            <a href={gateway + data.ipfsHash} target="_blank" rel="noopener" title="Open the IPFS file" className="shrink-0">
              <AssetAvatar name={data.name} hasIpfs size={72} />
            </a>
          ) : (
            <AssetAvatar name={data.name} hasIpfs={false} size={56} />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="nx-eyebrow">{data.typeLabel}</p>
              {data.reissuable ? <Chip>Reissuable</Chip> : <Chip>Fixed supply</Chip>}
            </div>
            <h1 className="m-0 mt-1 text-2xl leading-tight font-bold break-all sm:text-[32px]">{data.name}</h1>
          </div>
        </div>
        <DetailGrid items={facts} />
      </section>

      <Holders asset={data} />
      <Related title="Sub-assets" names={data.subAssets} />
      <Related title="Unique tokens" names={data.uniques} />
      <RawJson title="Raw asset data" data={data.raw} note="JSON from getassetdata" />
    </>
  );
}
