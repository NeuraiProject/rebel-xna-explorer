import * as React from "react";
import type { ChainStrip as ChainStripData, Recent, Stats } from "../api/types";
import { errorTitle, useApi, type ApiError } from "../hooks/useApi";
import { formatCompact, formatDifficulty, formatDuration, formatHashrate, formatNumber, formatShare, formatUsd } from "../lib/format";
import { formatAmount } from "../lib/amount";
import { paths } from "../lib/route";
import { BlockRow, TxRow } from "../components/domain";
import { ChainStrip } from "../components/ChainStrip";
import { Card, ErrorState, RelativeTime, Skeleton, SkeletonRows, cx, useDocumentTitle } from "../components/ui";

const REFRESH = 10000;

/** Alternates between two class names each time the tip moves, so the glow restarts */
function useFlashOnChange(value: number | undefined): string {
  const previous = React.useRef<number | undefined>(undefined);
  const [flash, setFlash] = React.useState("");
  React.useEffect(() => {
    if (value === undefined) return;
    if (previous.current !== undefined && value > previous.current) {
      setFlash((current) => (current === "nx-flash-a" ? "nx-flash-b" : "nx-flash-a"));
    }
    previous.current = value;
  }, [value]);
  return flash;
}

function StatTile({ label, value, unit, sub, title }: { label: string; value: React.ReactNode; unit?: string; sub?: React.ReactNode; title?: string }) {
  return (
    <div title={title} className="neurai-card flex min-w-0 flex-col gap-1 px-3.5 py-3.5 sm:px-[18px] sm:py-4">
      <span className="truncate text-[10.5px] font-bold tracking-[0.08em] text-subtle uppercase sm:text-[11px]">{label}</span>
      <span className="truncate text-xl leading-tight font-bold whitespace-nowrap tabular-nums sm:text-[22px]">
        {value}
        {unit && <span className="ml-1 text-[13px] font-semibold text-subtle sm:text-sm">{unit}</span>}
      </span>
      {sub && <span className="truncate text-[11.5px] text-subtle sm:text-xs">{sub}</span>}
    </div>
  );
}

function StatsGrid({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <section aria-label="Network" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="neurai-card flex flex-col gap-2 px-3.5 py-3.5 sm:px-[18px] sm:py-4">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        ))}
      </section>
    );
  }
  const blockTime = formatDuration(stats.avgBlockTime);
  const hashrate = formatHashrate(stats.hashrate);
  //Coins that exist so far; the mempool has its own block in the strip above
  //The node's own count when its RPC allows it, else the emission schedule
  const circulating = stats.supply?.circulating || null;
  const supply = formatCompact(circulating ? Number(circulating.amount) : stats.supply?.mined ? Number(stats.supply.mined) : null);
  const maxSupply = formatCompact(stats.supply?.max ? Number(stats.supply.max) : null);
  const supplyTitle = [
    circulating && `${formatAmount(circulating.amount)} XNA in the UTXO set at block #${formatNumber(circulating.height)} (node)`,
    stats.supply?.mined && `${formatAmount(stats.supply.mined)} XNA mined by the emission schedule`,
    stats.supply?.max && `${formatAmount(stats.supply.max)} XNA at most`,
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <section aria-label="Network" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
      <StatTile
        label={circulating ? "Coins in circulation" : "Coins mined"}
        value={supply.value}
        unit={supply.unit ? supply.unit + " XNA" : "XNA"}
        title={supplyTitle || undefined}
        sub={
          stats.supply && stats.supply.share !== null
            ? formatShare(stats.supply.share) + " of the " + maxSupply.value + " " + maxSupply.unit + " max"
            : circulating
              ? "UTXO set at #" + formatNumber(circulating.height)
              : "unavailable"
        }
      />
      <StatTile label="Avg block time" value={blockTime.value} unit={blockTime.unit} sub="last 100 blocks" />
      <StatTile label="Hashrate" value={hashrate.value} unit={hashrate.unit} sub="network estimate" />
      <StatTile label="Difficulty" value={formatDifficulty(stats.difficulty)} sub={"at block #" + formatNumber(stats.height)} />
      <StatTile
        label="Throughput"
        value={stats.txRate !== null ? stats.txRate.toFixed(stats.txRate < 1 ? 3 : 2) : "—"}
        unit="tx/s"
        sub="24 h average"
      />
      {stats.price ? (
        <StatTile
          label="XNA price"
          value={formatUsd(stats.price.usd)}
          sub={
            stats.price.change24h !== null ? (
              <span className={stats.price.change24h >= 0 ? "text-ok" : "text-bad"}>
                {stats.price.change24h >= 0 ? "+" : ""}
                {stats.price.change24h.toFixed(1)}% in 24 h
              </span>
            ) : (
              "via CoinGecko"
            )
          }
        />
      ) : (
        <StatTile label="Transactions" value={formatNumber(stats.txCount)} sub="since the genesis block" />
      )}
    </section>
  );
}

function ChainCard({ chain, error, onRetry, flash }: { chain: ChainStripData | null; error: ApiError | null; onRetry: () => void; flash: string }) {
  const tip = chain?.blocks[0];
  return (
    <section aria-labelledby="chain-title" className="neurai-card flex min-w-0 flex-col gap-4 px-4 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="chain-title" className="nx-eyebrow">
          Blockchain
        </h2>
        {tip && (
          <p className="m-0 text-[13px] text-muted">
            Latest{" "}
            <a href={paths.block(tip.height)} className={cx("rounded px-1 font-semibold tabular-nums", flash)}>
              #{formatNumber(tip.height)}
            </a>{" "}
            mined <RelativeTime time={tip.time} />
          </p>
        )}
      </div>
      {chain ? (
        <ChainStrip data={chain} />
      ) : error ? (
        <ErrorState title={errorTitle(error, "Could not reach the Neurai node")} error={error} onRetry={onRetry} />
      ) : (
        <div className="flex gap-5 overflow-hidden" role="status" aria-label="Loading">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="mt-6 h-[108px] w-[108px] shrink-0 rounded-none sm:h-[124px] sm:w-[124px]" />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage() {
  useDocumentTitle(null);
  const stats = useApi<Stats>("/api/stats", { refreshMs: REFRESH });
  const chain = useApi<ChainStripData>("/api/chain?count=10", { refreshMs: REFRESH });
  const recent = useApi<Recent>("/api/recent", { refreshMs: REFRESH });
  const flash = useFlashOnChange(chain.data?.tip.height);

  const txs = recent.data ? [...recent.data.pending, ...recent.data.confirmed].slice(0, 8) : null;

  return (
    <>
      <h1 className="nx-visually-hidden">Neurai blockchain explorer</h1>
      {/* Each card shows its own error, so one failing request leaves the rest of the page working */}
      <ChainCard chain={chain.data} error={chain.error} onRetry={chain.reload} flash={flash} />
      <StatsGrid stats={stats.data} />

      {/* Side by side the two lists stretch to the same height */}
      <div className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-2">
        <Card flush title="Latest blocks" action={<a href={paths.blocks()} className="py-1.5 text-xs font-semibold">View all</a>}>
          {chain.error && !chain.data ? (
            <ErrorState title={errorTitle(chain.error, "Could not load the blocks")} error={chain.error} onRetry={chain.reload} />
          ) : chain.data ? (
            chain.data.blocks.slice(0, 8).map((block, index) => (
              //Phones show five rows, wide screens eight
              <div key={block.hash} className={index >= 5 ? "max-sm:hidden" : undefined}>
                <BlockRow block={block} flash={index === 0 ? flash : undefined} />
              </div>
            ))
          ) : (
            <SkeletonRows rows={5} />
          )}
        </Card>

        <Card flush title="Latest transactions" action={<a href={paths.mempool()} className="py-1.5 text-xs font-semibold">Mempool</a>}>
          {recent.error && !txs ? (
            <ErrorState title={errorTitle(recent.error, "Could not load transactions")} error={recent.error} onRetry={recent.reload} />
          ) : txs ? (
            txs.map((tx, index) => (
              <div key={tx.txid} className={index >= 5 ? "max-sm:hidden" : undefined}>
                <TxRow tx={tx} />
              </div>
            ))
          ) : (
            <SkeletonRows rows={5} />
          )}
        </Card>
      </div>
    </>
  );
}
