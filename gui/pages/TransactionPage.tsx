import * as React from "react";
import type { Price, TxDetail, TxInput, TxOutput } from "../api/types";
import { useApi } from "../hooks/useApi";
import { useSettings } from "../hooks/useSettings";
import { toSatoshis, usdValue } from "../lib/amount";
import { isIpfsHash } from "../../shared/transactions.js";
import { addressFamily } from "../../shared/addresses.js";
import { formatDateTime, formatFeeRate, formatNumber, formatShare, middleEllipsis, plural } from "../lib/format";
import { getSearchParam, paths, setSearchParams } from "../lib/route";
import { AmountText, AssetBadge, PendingChip } from "../components/domain";
import { IconArrowRight, IconFile, IconFlame, IconIncoming, IconLock, IconReturn, IconTarget, IconZap } from "../components/Icons";
import {
  Breadcrumb,
  Card,
  CardSkeleton,
  Chip,
  CopyButton,
  DetailGrid,
  EmptyState,
  ErrorState,
  HashText,
  RawJson,
  RelativeTime,
  cx,
  useDocumentTitle,
  type Detail,
} from "../components/ui";

const FOLD = 10;

function locktimeText(locktime: number): string {
  if (!locktime) return "no time lock";
  if (locktime < 500000000) return "valid from block #" + formatNumber(locktime);
  return "valid from " + formatDateTime(locktime);
}

/** What each output is worth against everything paid out in the same asset */
function shares(outputs: TxOutput[]): Map<number, number> {
  const totals = new Map<string, bigint>();
  const amountOf = (o: TxOutput) => (o.asset ? toSatoshis(o.asset.amount) : toSatoshis(o.value));
  const nameOf = (o: TxOutput) => (o.asset ? o.asset.name : "XNA");
  for (const output of outputs) {
    if (output.type === "nulldata") continue;
    totals.set(nameOf(output), (totals.get(nameOf(output)) || 0n) + amountOf(output));
  }
  const result = new Map<number, number>();
  for (const output of outputs) {
    const total = totals.get(nameOf(output)) || 0n;
    if (output.type === "nulldata" || total === 0n) continue;
    result.set(output.n, Number((amountOf(output) * 1000000n) / total) / 1000000);
  }
  return result;
}

function AddressLine({ address, highlighted, from }: { address: string; highlighted: boolean; from: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <HashText value={address} href={paths.address(address)} responsive plain head={12} tail={8} className="min-w-0 text-[13px]" />
      <CopyButton value={address} label="Copy address" />
      {highlighted && from && (
        <span className="ml-auto shrink-0 pl-2 text-[10.5px] font-bold tracking-[0.04em] text-link uppercase">You came from here</span>
      )}
    </div>
  );
}

function InputItem({ input, from }: { input: TxInput; from: string | null }) {
  if (input.coinbase) {
    return (
      <li className="nx-inset flex flex-col gap-1 px-3 py-2.5 sm:px-3.5 sm:py-3">
        <span className="flex items-center gap-2 font-bold">
          <IconZap size={16} className="text-link" />
          Newly generated coins
        </span>
        <span className="text-[13px] text-muted">Block reward plus the fees of the block</span>
        {input.coinbaseHex && <span className="font-mono text-xs break-all text-subtle">coinbase {input.coinbaseHex}</span>}
      </li>
    );
  }
  const highlighted = !!from && input.address === from;
  return (
    <li className={cx("nx-inset flex flex-col gap-1 py-2.5 pr-1.5 pl-3 sm:py-3 sm:pl-3.5", highlighted && "nx-inset--highlight")}>
      <div className="flex flex-wrap items-center gap-2 pr-1.5">
        {input.asset ? (
          <>
            <AmountText value={input.asset.amount} className="text-base font-bold" />
            <AssetBadge name={input.asset.name} />
          </>
        ) : (
          <>
            <AmountText value={input.value} className="text-base font-bold" />
            <AssetBadge name="XNA" />
          </>
        )}
      </div>
      {input.address ? (
        <AddressLine address={input.address} highlighted={highlighted} from={from} />
      ) : (
        <span className="text-[13px] text-subtle">Unknown address</span>
      )}
      {input.txid && (
        <span className="pr-1.5 font-mono text-xs text-subtle">
          from{" "}
          <a href={paths.tx(input.txid)} title={input.txid + ":" + input.vout}>
            {middleEllipsis(input.txid, 8, 6)}:{input.vout}
          </a>
        </span>
      )}
    </li>
  );
}

type PoolRole = "state" | "reserve" | null;

function OutputItem({
  output,
  share,
  from,
  gateway,
  role,
}: {
  output: TxOutput;
  share: number | undefined;
  from: string | null;
  gateway: string;
  role: PoolRole;
}) {
  const highlighted = !!from && output.address === from;
  //The pool's state digest travels as an asset message: it is not a memo
  const message = role === "state" ? null : output.asset?.message || null;
  const isIpfs = !!message && isIpfsHash(message);
  return (
    <li className={cx("nx-inset flex flex-col gap-1 py-2.5 pr-1.5 pl-3 sm:py-3 sm:pl-3.5", highlighted && "nx-inset--highlight")}>
      <div className="flex flex-wrap items-center gap-2 pr-1.5">
        {output.asset ? (
          <>
            <AmountText value={output.asset.amount} className="text-base font-bold" />
            <AssetBadge name={output.asset.name} />
          </>
        ) : (
          <>
            <AmountText value={output.value} className="text-base font-bold" />
            <AssetBadge name="XNA" />
          </>
        )}
        {role === "state" && (
          <span title="Records the pool's new state; the message is its digest" className="nx-chip nx-chip--privacy px-2 py-px text-[11px]">
            <IconLock size={12} />
            Pool state
          </span>
        )}
        {role === "reserve" && (
          <span title="Holds the coins inside the privacy pool" className="nx-chip nx-chip--privacy px-2 py-px text-[11px]">
            <IconLock size={12} />
            Pool reserve
          </span>
        )}
        {output.change && !role && (
          <span title="Goes back to an address that funded this transaction" className="nx-chip px-2 py-px text-[11px]">
            <IconReturn size={12} />
            Back to sender
          </span>
        )}
        {output.burn && (
          <span title="Sent to an address nobody can spend from" className="nx-chip nx-chip--warn px-2 py-px text-[11px]">
            <IconFlame size={12} />
            Burned
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-subtle">#{output.n}</span>
      </div>

      {output.type === "nulldata" ? (
        <div className="flex flex-col gap-0.5 pr-1.5">
          <span className="text-[13px] font-semibold text-muted">OP_RETURN · data, cannot be spent</span>
          {output.dataText && <span className="text-[13px] break-words">“{output.dataText}”</span>}
          {output.data && <span className="font-mono text-xs break-all text-subtle">{output.data}</span>}
        </div>
      ) : output.address ? (
        <AddressLine address={output.address} highlighted={highlighted} from={from} />
      ) : (
        <span className="text-[13px] text-subtle">{output.type}</span>
      )}

      {share !== undefined && (
        <div className="flex items-center gap-2.5 pr-1.5" title={formatShare(share) + " of the " + (output.asset ? output.asset.name : "XNA") + " paid out"}>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-300">
            <div className="h-full rounded-full bg-brand" style={{ width: Math.max(share * 100, 1) + "%" }} />
          </div>
          <span className="shrink-0 text-[11.5px] text-subtle tabular-nums">
            {formatShare(share)} of {output.asset ? output.asset.name : "XNA"} out
          </span>
        </div>
      )}

      {role === "state" && output.asset?.message && (
        <span className="pr-1.5 text-xs text-muted">
          state digest <span className="font-mono" title={output.asset.message}>{middleEllipsis(output.asset.message, 10, 6)}</span>
        </span>
      )}

      {message && (
        <div className="flex min-w-0 items-center gap-1.5 pr-1.5 text-xs text-muted">
          <IconFile size={14} className="shrink-0" />
          <span className="shrink-0">{isIpfs ? "IPFS memo" : "Memo"}</span>
          {isIpfs ? (
            <a href={gateway + message} target="_blank" rel="noopener" title={message} className="truncate font-mono">
              {middleEllipsis(message, 10, 6)}
            </a>
          ) : (
            <span title={message} className="truncate font-mono">
              {middleEllipsis(message, 10, 6)}
            </span>
          )}
        </div>
      )}

      {output.type !== "nulldata" && (
        <span className="pr-1.5 text-xs text-subtle">
          {output.spent ? (
            <>
              Spent in{" "}
              <a href={paths.tx(output.spent.txid)} className="font-mono">
                {middleEllipsis(output.spent.txid, 8, 6)}
              </a>
              {output.spent.height ? <> · block #{formatNumber(output.spent.height)}</> : null}
            </>
          ) : output.spentKnown ? (
            "Unspent"
          ) : (
            "Spending not checked"
          )}
        </span>
      )}
    </li>
  );
}

function Folded<T>({ items, render, label }: { items: T[]; render: (item: T) => React.ReactNode; label: string }) {
  const [all, setAll] = React.useState(false);
  const shown = all ? items : items.slice(0, FOLD);
  return (
    <>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">{shown.map(render)}</ul>
      {items.length > FOLD && (
        <button type="button" className="neurai-btn--secondary btn-sm min-h-10 text-base-content" onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer " + label : `Show all ${formatNumber(items.length)} ${label}`}
        </button>
      )}
    </>
  );
}

function Flow({ tx, from, onClearFrom }: { tx: TxDetail; from: string | null; onClearFrom: () => void }) {
  const settings = useSettings();
  const gateway = settings?.ipfs_gateway || "https://ipfs.io/ipfs/";
  const outputShares = React.useMemo(() => shares(tx.outputs), [tx.outputs]);
  //In a pool transaction output 0 is the state; the reserve sits at an AuthScript
  //address that the transaction also spends from (or output 1 on the first deposit)
  const poolRole = React.useMemo(() => {
    const roles = new Map<number, PoolRole>();
    if (!tx.pool) return roles;
    roles.set(0, "state");
    const stateAddress = tx.outputs[0]?.address;
    const isContract = (address: string | null | undefined) => !!address && addressFamily(address) === "authscript";
    const spent = tx.inputs[1]?.address;
    const reserveAddress = isContract(spent) && spent !== stateAddress ? spent : isContract(tx.outputs[1]?.address) ? tx.outputs[1].address : null;
    for (const output of tx.outputs) {
      if (output.n > 0 && reserveAddress && output.address === reserveAddress) roles.set(output.n, "reserve");
    }
    return roles;
  }, [tx]);
  const involved = !!from && (tx.inputs.some((i) => i.address === from) || tx.outputs.some((o) => o.address === from));

  const totalIn = tx.kind === "coinbase" ? (
    <>
      <AmountText value={tx.totalOut} asset="XNA" /> <span className="text-subtle">(new)</span>
    </>
  ) : (
    <>
      {tx.totalIn !== null ? <AmountText value={tx.totalIn} asset="XNA" /> : "—"}
      {tx.assetsIn.map((a) => (
        <span key={a.asset}>
          {" + "}
          <AmountText value={a.amount} asset={a.asset} />
        </span>
      ))}
    </>
  );

  return (
    <Card flush title="Inputs and outputs" action={<span className="text-xs text-subtle">{plural(tx.inputs.length, "input")} → {plural(tx.outputs.length, "output")}</span>}>
      {involved && (
        <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-[10px] border border-accent-line bg-accent py-1.5 pr-1.5 pl-3.5 text-[13px] sm:mx-[18px]">
          <IconTarget size={16} className="shrink-0 text-link" />
          <span className="min-w-0 flex-1">
            Highlighting <span className="font-mono font-semibold">{middleEllipsis(from as string, 8, 6)}</span>, the address you came from.
          </span>
          <button type="button" onClick={onClearFrom} className="neurai-btn--ghost btn-sm min-h-9 text-link">
            Clear
          </button>
        </div>
      )}

      <div className="grid gap-x-0 gap-y-3 px-4 pb-4 sm:px-[18px] sm:pb-5 md:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)]">
        <section aria-label="Inputs" className="flex min-w-0 flex-col gap-2.5">
          <h3 className="nx-eyebrow">Inputs ({formatNumber(tx.inputs.length)})</h3>
          <Folded items={tx.inputs} label="inputs" render={(input) => <InputItem key={(input.txid || "cb") + ":" + input.vout} input={input} from={from} />} />
          <div className="flex justify-between gap-3 rounded-[10px] border border-dashed border-base-300 px-3.5 py-2.5 text-[13px] text-muted">
            <span>Total in</span>
            <span className="text-right font-semibold">{totalIn}</span>
          </div>
        </section>

        <div aria-hidden="true" className="hidden justify-center pt-9 text-brand md:flex">
          <IconArrowRight size={24} />
        </div>
        <div aria-hidden="true" className="flex items-center gap-2.5 text-xs font-semibold text-subtle md:hidden">
          <span className="h-px flex-1 bg-base-300" />
          <span className="grid h-7 w-7 place-items-center rounded-full border border-base-300 bg-sunken text-brand">
            <IconIncoming size={15} />
          </span>
          {plural(tx.outputs.length, "output")}
          <span className="h-px flex-1 bg-base-300" />
        </div>

        <section aria-label="Outputs" className="flex min-w-0 flex-col gap-2.5">
          <h3 className="nx-eyebrow">Outputs ({formatNumber(tx.outputs.length)})</h3>
          <Folded
            items={tx.outputs}
            label="outputs"
            render={(output) => (
              <OutputItem
                key={output.n}
                output={output}
                share={tx.pool ? undefined : outputShares.get(output.n)}
                from={from}
                gateway={gateway}
                role={poolRole.get(output.n) || null}
              />
            )}
          />
          <div className="flex justify-between gap-3 rounded-[10px] border border-dashed border-base-300 px-3.5 py-2.5 text-[13px] text-muted">
            <span>Fee</span>
            <span className="font-semibold">
              {tx.kind === "coinbase" ? "None (coinbase)" : tx.fee !== null ? <AmountText value={tx.fee} asset="XNA" /> : "—"}
            </span>
          </div>
        </section>
      </div>
    </Card>
  );
}

export function TransactionPage({ id }: { id: string }) {
  const [poll, setPoll] = React.useState<number | undefined>(undefined);
  const [from, setFrom] = React.useState<string | null>(() => getSearchParam("from"));
  const result = useApi<TxDetail>("/api/transactions/" + encodeURIComponent(id), { refreshMs: poll });
  const tx = result.data;
  const price = useApi<Price | null>(tx && tx.kind !== "coinbase" ? "/api/price" : null);
  useDocumentTitle("Transaction " + middleEllipsis(id, 8, 6));

  //An unconfirmed transaction is watched until a block includes it
  React.useEffect(() => {
    if (tx) setPoll(tx.pending ? 10000 : undefined);
  }, [tx?.pending]);

  const clearFrom = () => {
    setFrom(null);
    setSearchParams({ from: null });
  };

  const crumbs = (
    <Breadcrumb
      items={[
        { label: "Home", href: paths.home() },
        tx && !tx.pending && tx.height !== null
          ? { label: "Block #" + formatNumber(tx.height), href: paths.block(tx.height) }
          : { label: "Mempool", href: paths.mempool() },
        { label: "Transaction" },
      ]}
    />
  );

  if (result.error && !tx) {
    return (
      <>
        {crumbs}
        <Card>
          {result.error.status === 404 || result.error.status === 400 ? (
            <EmptyState title={result.error.message}>
              A transaction appears here once a node has seen it. If it was sent moments ago, try again shortly.
            </EmptyState>
          ) : (
            <ErrorState title="Could not load the transaction" error={result.error} onRetry={result.reload} />
          )}
        </Card>
      </>
    );
  }
  if (!tx) {
    return (
      <>
        {crumbs}
        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
      </>
    );
  }

  const coinbase = tx.kind === "coinbase";
  const usd = tx.fee && price.data ? usdValue(tx.fee, price.data.usd) : null;
  const assetsMoved = [...new Set([...tx.assetsOut.map((a) => a.asset)])];
  const recipients = tx.moved
    ? new Set(
        tx.outputs
          .filter((o) => !o.change && o.address && (o.asset ? o.asset.name : "XNA") === tx.moved!.asset)
          .map((o) => o.address)
      ).size
    : 0;

  const facts: Detail[] = [
    tx.pending
      ? { label: "Block", value: "Not in a block yet", sub: "waiting in the mempool" }
      : {
          label: "Block",
          value: tx.height !== null ? <a href={paths.block(tx.height)}>#{formatNumber(tx.height)}</a> : "—",
          sub: plural(tx.confirmations, "confirmation"),
        },
    tx.pending
      ? { label: "First seen", value: <RelativeTime time={tx.firstSeen} />, sub: formatDateTime(tx.firstSeen) }
      : { label: "Time", value: <RelativeTime time={tx.time} />, sub: formatDateTime(tx.time) },
    coinbase
      ? { label: "Fee", value: "None", sub: "a coinbase pays no fee" }
      : { label: "Fee", value: tx.fee !== null ? <AmountText value={tx.fee} asset="XNA" /> : "—", sub: usd ? "≈ " + usd : undefined },
    { label: "Fee rate", value: coinbase ? "—" : formatFeeRate(tx.feeRate), sub: coinbase ? "not applicable" : "fee ÷ virtual size" },
    { label: "Size", value: formatNumber(tx.size) + " B", sub: "virtual size " + formatNumber(tx.vsize) + " vB" },
    {
      label: "Inputs → outputs",
      value: `${formatNumber(tx.inputs.length)} → ${formatNumber(tx.outputs.length)}`,
      sub: coinbase ? "new coins" : assetsMoved.length ? ["XNA", ...assetsMoved].join(", ") : "XNA only",
    },
    tx.pool
      ? {
          label: "Moved",
          value: tx.moved ? <AmountText value={tx.moved.amount} asset={tx.moved.asset} /> : "Private",
          sub:
            tx.pool.action === "deposit"
              ? "into " + tx.pool.name
              : tx.pool.action === "withdrawal"
                ? "out of " + tx.pool.name
                : tx.pool.action === "create"
                  ? "new pool " + tx.pool.name
                  : "amounts stay inside " + tx.pool.name,
        }
      : {
      label: "Moved",
      value: tx.moved ? <AmountText value={tx.moved.amount} asset={tx.moved.asset} /> : "—",
      sub: coinbase
        ? "block reward plus fees"
        : tx.kind === "asset-issue"
          ? "newly issued"
          : recipients
            ? "to " + plural(recipients, "address", "addresses")
            : "back to the sender",
    },
    { label: "Version · locktime", value: `${tx.version} · ${formatNumber(tx.locktime)}`, sub: locktimeText(tx.locktime) },
  ];

  return (
    <>
      {crumbs}
      <section className="neurai-card flex flex-col gap-4 px-4 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="nx-eyebrow mr-1.5">Transaction</p>
          {tx.pending ? <PendingChip /> : <Chip tone="ok" dot>Confirmed</Chip>}
          <span className="text-[13px] text-muted">
            {tx.pending ? (
              <>
                In the mempool · first seen <RelativeTime time={tx.firstSeen} />
              </>
            ) : (
              plural(tx.confirmations, "confirmation")
            )}
          </span>
          <span aria-hidden="true" className="mx-1 hidden h-[18px] w-px bg-base-300 sm:block" />
          {tx.tags.map((tag) => (
            <Chip
              key={tag}
              tone={tag === "Burn" ? "warn" : tx.pool && tag === tx.label ? "privacy" : tag === "Asset issue" ? "rainbow" : "neutral"}
            >
              {tag === "Burn" && <IconFlame size={12} />}
              {tx.pool && tag === tx.label && <IconLock size={12} />}
              {tag}
            </Chip>
          ))}
        </div>
        <h1 className="m-0 flex min-w-0 items-start gap-2.5 sm:items-center">
          <span className="min-w-0 flex-1 font-mono text-[13.5px] leading-normal font-semibold break-all sm:text-[17px]">{tx.txid}</span>
          <CopyButton value={tx.txid} label="Copy transaction id" showText className="border border-base-300 bg-sunken text-muted" />
        </h1>
        <DetailGrid items={facts} />
      </section>

      <Flow tx={tx} from={from} onClearFrom={clearFrom} />
      <RawJson title="Raw transaction" data={tx.raw} note="JSON from getrawtransaction" />
      {tx.inputs.some((input) => input.asset) && (
        <p className="m-0 px-1 text-xs text-subtle">
          Asset inputs carry no XNA; their asset and amount were read from the outputs they spend.
        </p>
      )}
    </>
  );
}
