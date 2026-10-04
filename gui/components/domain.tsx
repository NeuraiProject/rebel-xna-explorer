import * as React from "react";
import type { AssetType, BlockSummary, TxKind, TxSummary } from "../api/types";
import { absAmount, amountSign, formatAmount, formatShortAmount, splitAmount, type Amount } from "../lib/amount";
import { formatBytes, middleEllipsis, plural } from "../lib/format";
import { paths } from "../lib/route";
import { assetType } from "../../shared/assets.js";
import {
  IconBlock,
  IconChip,
  IconFile,
  IconGem,
  IconHash,
  IconKey,
  IconLayers,
  IconLock,
  IconMessage,
  IconPlusCircle,
  IconRefresh,
  IconSend,
  IconTag,
  IconZap,
} from "./Icons";
import { Chip, ListRow, RelativeTime, cx } from "./ui";

/* ---------------------------------------------------------------------------
 * Amounts
 * ------------------------------------------------------------------------ */

/** An amount with its asset: "120.47588 XNA". Signed shows +/− in colour. */
export function AmountText({
  value,
  asset,
  signed = false,
  short = false,
  className,
}: {
  value: Amount | null | undefined;
  asset?: string;
  signed?: boolean;
  short?: boolean;
  className?: string;
}) {
  if (value === null || value === undefined) return <span className={className}>—</span>;
  const sign = amountSign(value);
  const body = short ? formatShortAmount(absAmount(value)) : formatAmount(absAmount(value));
  return (
    <span className={cx("tabular-nums", signed && sign > 0 && "text-ok", className)}>
      {signed && sign !== 0 && (sign > 0 ? "+" : "−")}
      {!signed && sign < 0 && "−"}
      {body}
      {asset && <span className="font-medium text-subtle"> {asset}</span>}
    </span>
  );
}

/** The headline amount: whole part large, decimals two thirds of it (the wallet's BalanceAmount) */
export function BigAmount({ value, asset, size = "lg" }: { value: Amount; asset?: string; size?: "lg" | "md" }) {
  const { whole, fraction } = splitAmount(value);
  const big = size === "lg" ? "text-[34px] sm:text-[42px]" : "text-[28px] sm:text-[34px]";
  const small = size === "lg" ? "text-[23px] sm:text-[28px]" : "text-[19px] sm:text-[23px]";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5">
      <span className="font-bold leading-none tracking-tight tabular-nums">
        <span className={big}>{whole}</span>
        {fraction && <span className={small}>.{fraction}</span>}
      </span>
      {asset && <span className="text-[17px] font-semibold text-subtle">{asset}</span>}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Assets
 * ------------------------------------------------------------------------ */

export function AssetTypeIcon({ type, size = 18 }: { type: AssetType; size?: number }) {
  switch (type) {
    case "depin":
      return <IconChip size={size} />;
    case "qualifier":
      return <IconHash size={size} />;
    case "sub":
      return <IconLayers size={size} />;
    case "unique":
      return <IconGem size={size} />;
    case "owner":
      return <IconKey size={size} />;
    case "restricted":
      return <IconLock size={size} />;
    case "channel":
      return <IconMessage size={size} />;
    default:
      return <IconTag size={size} />;
  }
}

/** Asset name next to an amount; links to the asset unless it is the coin itself */
export function AssetBadge({ name, link = true }: { name: string; link?: boolean }) {
  if (name === "XNA") return <span className="nx-asset">XNA</span>;
  const icon = <AssetTypeIcon type={assetType(name) as AssetType} size={12} />;
  if (!link) {
    return (
      <span className="nx-asset">
        {icon}
        {name}
      </span>
    );
  }
  return (
    <a className="nx-asset" href={paths.asset(name)}>
      {icon}
      {name}
    </a>
  );
}

/** Asset image when it has one on IPFS, its type icon otherwise */
export function AssetAvatar({ name, hasIpfs, size = 38 }: { name: string; hasIpfs: boolean; size?: number }) {
  const [failed, setFailed] = React.useState(false);
  const style = { width: size, height: size };
  if (hasIpfs && !failed) {
    return (
      <img
        src={"/thumbnail?assetName=" + encodeURIComponent(name)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        style={style}
        className="shrink-0 rounded-[10px] border border-base-300 bg-sunken object-cover"
      />
    );
  }
  return (
    <span style={style} className="grid shrink-0 place-items-center rounded-[10px] border border-base-300 bg-sunken text-muted">
      <AssetTypeIcon type={assetType(name) as AssetType} size={Math.round(size / 2)} />
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Transactions and blocks in lists
 * ------------------------------------------------------------------------ */

export function TxKindIcon({ kind, size = 18 }: { kind: TxKind; size?: number }) {
  switch (kind) {
    case "coinbase":
      return <IconZap size={size} />;
    case "asset-issue":
      return <IconPlusCircle size={size} />;
    case "asset-reissue":
      return <IconRefresh size={size} />;
    case "asset-transfer":
      return <IconTag size={size} />;
    case "qualifier":
      return <IconHash size={size} />;
    case "depin":
      return <IconChip size={size} />;
    case "privacy":
      return <IconLock size={size} />;
    case "data":
      return <IconFile size={size} />;
    default:
      return <IconSend size={size} />;
  }
}

export function PendingChip() {
  return (
    <Chip tone="warn" dot pulse>
      Pending
    </Chip>
  );
}

/** One transaction in a list: kind, id, what moved, when */
export function TxRow({ tx, showTime = true }: { tx: TxSummary; showTime?: boolean }) {
  const io = tx.kind === "coinbase" ? "new coins" : `${tx.inputs} in → ${tx.outputs} out`;
  const when = tx.pending ? (
    <RelativeTime time={tx.firstSeen || tx.time} prefix="seen " />
  ) : showTime ? (
    <RelativeTime time={tx.time} />
  ) : tx.fee ? (
    <>fee {formatAmount(tx.fee)} XNA</>
  ) : null;
  return (
    <ListRow
      href={paths.tx(tx.txid)}
      icon={<TxKindIcon kind={tx.kind} />}
      title={<span className="inline-block align-top font-mono text-[13px] leading-6">{middleEllipsis(tx.txid, 10, 8)}</span>}
      titleExtra={tx.pending ? <PendingChip /> : undefined}
      detail={`${tx.label} · ${io}`}
      value={tx.moved ? <AmountText value={tx.moved.amount} asset={tx.moved.asset} short /> : tx.kind === "privacy" ? "private" : "—"}
      sub={when}
    />
  );
}

export function BlockRow({ block, flash }: { block: BlockSummary; flash?: string }) {
  return (
    <ListRow
      href={paths.block(block.height)}
      className={flash}
      icon={<IconBlock />}
      title={<span className="tabular-nums">#{block.height.toLocaleString("en-US")}</span>}
      detail={
        <>
          <RelativeTime time={block.time} /> · {plural(block.txCount, "tx", "txs")}
        </>
      }
      value={formatBytes(block.size)}
      sub={<span className="font-mono">{middleEllipsis(block.hash, 8, 6)}</span>}
    />
  );
}
