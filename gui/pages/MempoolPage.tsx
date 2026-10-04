import type { Mempool } from "../api/types";
import { useApi } from "../hooks/useApi";
import { formatBytes, formatNumber } from "../lib/format";
import { paths } from "../lib/route";
import { TxRow } from "../components/domain";
import { Breadcrumb, Card, EmptyState, ErrorState, SkeletonRows, useDocumentTitle } from "../components/ui";

export function MempoolPage() {
  useDocumentTitle("Mempool");
  const mempool = useApi<Mempool>("/api/mempool?limit=100", { refreshMs: 5000 });
  const data = mempool.data;

  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: paths.home() }, { label: "Mempool" }]} />
      <section className="neurai-card flex flex-col gap-1 px-4 py-5 sm:px-7 sm:py-6">
        <p className="nx-eyebrow">Mempool</p>
        <h1 className="m-0 mt-1 text-2xl font-bold sm:text-[28px]">
          {data ? formatNumber(data.size) : "…"} <span className="text-lg font-semibold text-subtle">{data && data.size === 1 ? "transaction" : "transactions"} waiting</span>
        </h1>
        <p className="m-0 text-sm text-muted">
          {data ? formatBytes(data.bytes) + " · " : ""}Transactions the node has seen and no block has included yet. This page refreshes every 5 seconds.
        </p>
      </section>
      <Card flush title="Pending transactions" action={data && data.size > data.items.length ? <span className="text-xs text-subtle">newest {data.items.length}</span> : undefined}>
        {mempool.error && !data ? (
          <ErrorState title="Could not load the mempool" error={mempool.error} onRetry={mempool.reload} />
        ) : !data ? (
          <SkeletonRows rows={4} />
        ) : data.items.length === 0 ? (
          <div className="border-t border-base-300">
            <EmptyState title="The mempool is empty">
              Every transaction the node knows about is already in a block. New ones appear here until the next block includes them.
            </EmptyState>
          </div>
        ) : (
          data.items.map((tx) => <TxRow key={tx.txid} tx={tx} />)
        )}
      </Card>
    </>
  );
}
