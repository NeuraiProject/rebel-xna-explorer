import * as React from "react";
import type { BlockDetail, Paged, TxSummary } from "../api/types";
import { useApi } from "../hooks/useApi";
import { formatAmount } from "../lib/amount";
import { formatBytes, formatDateTime, formatDifficulty, formatNumber, plural } from "../lib/format";
import { getSearchParam, paths, setSearchParams } from "../lib/route";
import { AmountText, TxRow } from "../components/domain";
import { IconChevronLeft, IconChevronRight } from "../components/Icons";
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
  RelativeTime,
  SkeletonRows,
  useDocumentTitle,
  type Detail,
} from "../components/ui";

const PAGE = 25;

/** ← and → walk the chain, unless the user is typing */
function useArrowKeys(previous: string | null, next: string | null) {
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (event.key === "ArrowLeft" && previous) window.location.href = previous;
      if (event.key === "ArrowRight" && next) window.location.href = next;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previous, next]);
}

function Transactions({ block }: { block: BlockDetail }) {
  const [page, setPage] = React.useState(() => Math.max(1, parseInt(getSearchParam("page") || "1", 10) || 1));
  const txs = useApi<Paged<TxSummary>>(`/api/blocks/${block.hash}/txs?page=${page}&size=${PAGE}`);
  const onPage = (value: number) => {
    setPage(value);
    setSearchParams({ page: value > 1 ? value : null });
    document.getElementById("block-transactions")?.scrollIntoView({ block: "start" });
  };
  return (
    <Card
      flush
      id="block-transactions"
      title={
        <>
          Transactions <span className="ml-1 font-normal text-subtle tabular-nums">{formatNumber(block.txCount)}</span>
        </>
      }
    >
      {txs.error && !txs.data ? (
        <ErrorState title="Could not load the transactions" error={txs.error} onRetry={txs.reload} />
      ) : !txs.data ? (
        <SkeletonRows rows={Math.min(5, block.txCount)} />
      ) : (
        <>
          {txs.data.items.map((tx) => (
            <TxRow key={tx.txid} tx={tx} showTime={false} />
          ))}
          <Pager page={txs.data.page} pages={txs.data.pages} onPage={onPage} previousLabel="Previous" nextLabel="Next" />
        </>
      )}
    </Card>
  );
}

export function BlockPage({ id }: { id: string }) {
  const block = useApi<BlockDetail>("/api/blocks/" + encodeURIComponent(id));
  const data = block.data;
  useDocumentTitle(data ? "Block #" + formatNumber(data.height) : "Block");

  const previous = data?.previousblockhash ? paths.block(data.height - 1) : null;
  const next = data?.nextblockhash ? paths.block(data.height + 1) : null;
  useArrowKeys(previous, next);

  const crumbs = (label: string) => (
    <Breadcrumb items={[{ label: "Home", href: paths.home() }, { label: "Blocks", href: paths.blocks() }, { label }]} />
  );

  if (block.error && !data) {
    const tip = block.error.body?.tip;
    return (
      <>
        {crumbs("Block")}
        <Card>
          {block.error.status === 404 || block.error.status === 400 ? (
            <EmptyState title={block.error.message}>
              {typeof tip === "number" && (
                <>
                  The chain is at <a href={paths.block(tip)}>block #{formatNumber(tip)}</a>.
                </>
              )}
            </EmptyState>
          ) : (
            <ErrorState title="Could not load the block" error={block.error} onRetry={block.reload} />
          )}
        </Card>
      </>
    );
  }
  if (!data) {
    return (
      <>
        {crumbs("Block")}
        <CardSkeleton lines={6} />
      </>
    );
  }

  const facts: Detail[] = [
    { label: "Mined", value: <RelativeTime time={data.time} />, sub: formatDateTime(data.time) },
    { label: "Transactions", value: formatNumber(data.txCount) },
    {
      label: "Reward",
      value: <AmountText value={data.reward} asset="XNA" />,
      sub: data.subsidy !== null ? <>subsidy {formatAmount(data.subsidy)} + fees</> : "subsidy plus fees",
    },
    { label: "Fees", value: data.fees !== null ? <AmountText value={data.fees} asset="XNA" /> : "—", sub: data.fees === null ? "too many transactions to add up" : undefined },
    { label: "Moved", value: data.totalOut !== null ? <AmountText value={data.totalOut} asset="XNA" short /> : "—", sub: "outputs of all but the coinbase" },
    { label: "Size", value: formatBytes(data.size), sub: `weight ${formatNumber(data.weight)} · stripped ${formatBytes(data.strippedsize)}` },
    { label: "Difficulty", value: formatDifficulty(data.difficulty), sub: "bits " + data.bits },
    { label: "Nonce · version", value: `${formatNumber(data.nonce)} · ${data.versionHex}`, sub: "median time " + formatDateTime(data.mediantime) },
    { label: "Hash", value: <HashText value={data.hash} full copy="Copy block hash" />, wide: true },
    {
      label: "Previous block",
      value: data.previousblockhash ? <HashText value={data.previousblockhash} href={paths.block(data.height - 1)} responsive head={12} tail={10} /> : "None, this is the genesis block",
      wide: true,
    },
    {
      label: "Next block",
      value: data.nextblockhash ? <HashText value={data.nextblockhash} href={paths.block(data.height + 1)} responsive head={12} tail={10} /> : "Not mined yet",
      wide: true,
    },
    { label: "Merkle root", value: <HashText value={data.merkleroot} responsive head={12} tail={10} />, wide: true },
    { label: "Chainwork", value: <HashText value={data.chainwork} responsive head={12} tail={10} />, wide: true },
  ];

  const navButton = "neurai-btn--secondary btn-sm min-h-11 text-base-content no-underline hover:no-underline";

  return (
    <>
      {crumbs("Block #" + formatNumber(data.height))}
      <section className="neurai-card flex flex-col gap-4 px-4 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <p className="nx-eyebrow">Block</p>
              <Chip tone="ok" dot>
                {plural(data.confirmations, "confirmation")}
              </Chip>
            </div>
            <h1 className="m-0 mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-subtle sm:text-[28px]">#</span>
              <span className="text-[34px] leading-none font-bold tracking-tight tabular-nums sm:text-[42px]">
                {formatNumber(data.height)}
              </span>
            </h1>
          </div>
          <nav aria-label="Neighbouring blocks" className="flex gap-2">
            {previous ? (
              <a href={previous} className={navButton} title="Previous block (←)">
                <IconChevronLeft size={16} />#{formatNumber(data.height - 1)}
              </a>
            ) : (
              <span className={navButton + " btn-disabled"}>
                <IconChevronLeft size={16} />
                Genesis
              </span>
            )}
            {next ? (
              <a href={next} className={navButton} title="Next block (→)">
                #{formatNumber(data.height + 1)}
                <IconChevronRight size={16} />
              </a>
            ) : (
              <span className={navButton + " btn-disabled"}>
                Latest
                <IconChevronRight size={16} />
              </span>
            )}
          </nav>
        </div>
        <DetailGrid items={facts} />
      </section>

      <Transactions block={data} />
      <RawJson title="Raw block" data={data.raw} note="JSON from getblock" />
    </>
  );
}
