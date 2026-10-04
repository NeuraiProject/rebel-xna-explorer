import * as React from "react";
import type { BlockList } from "../api/types";
import { useApi } from "../hooks/useApi";
import { formatBytes, formatDateTime, formatNumber, middleEllipsis } from "../lib/format";
import { getSearchParam, paths, setSearchParams } from "../lib/route";
import { BlockRow } from "../components/domain";
import { IconChevronLeft, IconChevronRight } from "../components/Icons";
import { Breadcrumb, Card, ErrorState, RelativeTime, SkeletonRows, useDocumentTitle } from "../components/ui";

const PAGE = 25;

function readBefore(): number | null {
  const value = parseInt(getSearchParam("before") || "", 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function BlocksPage() {
  useDocumentTitle("Blocks");
  const [before, setBefore] = React.useState<number | null>(readBefore);
  const [jump, setJump] = React.useState("");
  //The first page follows the chain; older pages stand still
  const list = useApi<BlockList>("/api/blocks?count=" + PAGE + (before ? "&before=" + before : ""), {
    refreshMs: before ? undefined : 10000,
  });

  const go = (value: number | null) => {
    setBefore(value);
    setSearchParams({ before: value });
    window.scrollTo({ top: 0 });
  };

  const blocks = list.data?.blocks || [];
  const tip = list.data?.tip ?? null;
  const top = blocks[0]?.height ?? null;
  const bottom = blocks[blocks.length - 1]?.height ?? null;
  const newer = top !== null && tip !== null && top < tip ? (top + PAGE + 1 > tip ? null : top + PAGE + 1) : undefined;
  const older = bottom !== null && bottom > 0 ? bottom : undefined;

  const pager = (
    <nav aria-label="Pages" className="flex items-center justify-between gap-2 border-t border-base-300 px-3 py-3 sm:px-[18px]">
      <button type="button" className="neurai-btn--secondary btn-sm min-h-11" disabled={newer === undefined} onClick={() => go(newer ?? null)}>
        <IconChevronLeft size={16} />
        Newer
      </button>
      <span className="text-xs text-subtle tabular-nums sm:text-sm">
        {top !== null && bottom !== null ? `#${formatNumber(bottom)} – #${formatNumber(top)}` : ""}
      </span>
      <button type="button" className="neurai-btn--secondary btn-sm min-h-11" disabled={older === undefined} onClick={() => go(older ?? null)}>
        Older
        <IconChevronRight size={16} />
      </button>
    </nav>
  );

  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: paths.home() }, { label: "Blocks" }]} />
      <Card
        flush
        heading="h1"
        title="Blocks"
        action={
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const height = parseInt(jump, 10);
              if (Number.isFinite(height) && height >= 0) window.location.href = paths.block(height);
            }}
          >
            <label htmlFor="jump" className="nx-visually-hidden">
              Go to block height
            </label>
            <input
              id="jump"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jump}
              onChange={(event) => setJump(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Go to height"
              className="h-9 w-32 rounded-lg border border-base-300 bg-sunken px-3 text-sm outline-none focus:border-brand sm:w-40"
            />
            <button type="submit" className="neurai-btn--secondary btn-sm min-h-9 text-base-content">
              Go
            </button>
          </form>
        }
      >
        {list.error && !list.data ? (
          <ErrorState title="Could not load the blocks" error={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <SkeletonRows rows={10} />
        ) : (
          <>
            {/* Phones: rows. Wider screens: a table, with room for every column */}
            <div className="md:hidden">
              {blocks.map((block) => (
                <BlockRow key={block.hash} block={block} />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-t border-base-300 text-left text-[11px] tracking-[0.08em] text-subtle uppercase">
                    <th scope="col" className="px-[18px] py-2.5 font-bold">Height</th>
                    <th scope="col" className="px-3 py-2.5 font-bold">Mined</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-bold">Transactions</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-bold">Size</th>
                    <th scope="col" className="px-[18px] py-2.5 font-bold">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.hash} className="border-t border-base-300 hover:bg-sunken">
                      <td className="px-[18px] py-3 font-semibold tabular-nums">
                        <a href={paths.block(block.height)}>#{formatNumber(block.height)}</a>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <RelativeTime time={block.time} />
                        <span className="ml-2 font-mono text-xs text-subtle">{formatDateTime(block.time)}</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatNumber(block.txCount)}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{formatBytes(block.size)}</td>
                      <td className="px-[18px] py-3 font-mono text-xs text-subtle">
                        <a href={paths.block(block.hash)} title={block.hash} className="text-subtle">
                          {middleEllipsis(block.hash, 14, 10)}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pager}
          </>
        )}
      </Card>
    </>
  );
}
