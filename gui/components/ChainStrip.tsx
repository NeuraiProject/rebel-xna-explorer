import * as React from "react";
import type { ChainStrip as ChainStripData, FeeRateSpread, StripBlock } from "../api/types";
import { formatAmount } from "../lib/amount";
import { formatBytes, formatDuration, formatNumber, plural } from "../lib/format";
import { paths } from "../lib/route";
import { useNow } from "../hooks/useNow";
import { RelativeTime, cx } from "./ui";

/*
  The chain as a row of glass cubes, the way mempool.space draws it: the next
  block (what waits in the mempool) on the left, a dashed line, then the mined
  blocks, newest first. Each cube holds a liquid that rises with the number of
  transactions, one bubble per transaction, coloured by kind. Its edges say
  what happened in it: rainbow when an asset was created, purple when coins
  entered or left a privacy pool. Colours live in explorer.css (.nx-glass).
*/

//Cube width and the least space between blocks, below and from the sm breakpoint.
//Keep in step with --cube in .nx-glass (explorer.css).
const SIZES = { narrow: { cube: 88, gap: 10 }, wide: { cube: 136, gap: 24 } };

/** How many cubes fit side by side in an element, so none is cut and nothing scrolls */
function useFittingCount(ref: React.RefObject<HTMLDivElement | null>): number {
  const fit = (width: number) => {
    const { cube, gap } = window.matchMedia("(min-width: 640px)").matches ? SIZES.wide : SIZES.narrow;
    return Math.max(1, Math.floor((width + gap) / (cube + gap)));
  };
  const [count, setCount] = React.useState(() => (typeof window === "undefined" ? 1 : fit(window.innerWidth / 2)));
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setCount(fit(element.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return count;
}

//Bubbles: eight to a row, four rows; in bigger blocks one bubble stands for several transactions
const PER_ROW = 8;
const BUBBLES = 32;
type Group = "coinbase" | "privacy" | "asset" | "payment" | "other" | "pending";

//The cube in SVG units: a 124 square front face, 12 deep
const FRONT = "0.75,12.75 123.25,12.75 123.25,135.25 0.75,135.25";
const TOP = "0.75,12.75 12.75,0.75 135.25,0.75 123.25,12.75";
const SIDE = "123.25,12.75 135.25,0.75 135.25,123.25 123.25,135.25";

function usePrefersReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = React.useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function rateText(spread: FeeRateSpread | null): string | null {
  if (!spread) return null;
  return "~" + formatNumber(Math.round(spread.median)) + " sat/vB";
}

function spanText(spread: FeeRateSpread | null): string | null {
  if (!spread || Math.round(spread.min) === Math.round(spread.max)) return null;
  return formatNumber(Math.round(spread.min)) + " – " + formatNumber(Math.round(spread.max));
}

//Small fixed nudges, so the bubbles do not sit on a grid
function jitter(n: number): number {
  return ((n * 7919) % 7) - 3;
}

interface Bubble {
  group: Group;
  left: string;
  bottom: string;
  size: number;
}

function bubbles(mix: Partial<Record<Group, number>>, count: number, seed: number): Bubble[] {
  if (count <= 0) return [];
  const per = Math.max(1, Math.ceil(count / BUBBLES));
  const order: Group[] = ["coinbase", "privacy", "asset", "payment", "other", "pending"];
  const groups: Group[] = [];
  for (const group of order) {
    //Every kind present gets at least one bubble, so a lone pool deposit still shows
    const n = (mix[group] || 0) > 0 ? Math.max(1, Math.round((mix[group] || 0) / per)) : 0;
    for (let i = 0; i < n && groups.length < BUBBLES; i++) groups.push(group);
  }
  return groups.map((group, j) => ({
    group,
    left: ((12 + (j % PER_ROW) * 13 + jitter(j + seed)) / 124) * 100 + "%",
    bottom: ((6 + Math.floor(j / PER_ROW) * 10 + (jitter(j * 3 + seed) % 3)) / 124) * 100 + "%",
    size: group === "coinbase" ? 7 : 6,
  }));
}

//The liquid's surface: a gentle wave across the front face
function wave(top: number, phase: number, amp: number): string {
  return (
    `M0.75 ${top} C 21 ${top - amp * phase}, 41 ${top + amp * phase}, 62 ${top} ` +
    `S 103 ${top - amp * phase}, 123.25 ${top} L123.25 135.25 L0.75 135.25 Z`
  );
}

interface GlassCubeProps {
  pending?: boolean;
  rainbow?: boolean;
  privacy?: boolean;
  lines: (string | null)[];
  size: number;
  count: number;
  mix: Partial<Record<Group, number>>;
  seed: number;
}

function GlassCube({ pending = false, rainbow = false, privacy = false, lines, size, count, mix, seed }: GlassCubeProps) {
  const reduced = usePrefersReducedMotion();
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const list = React.useMemo(() => bubbles(mix, count, seed), [mix, count, seed]);
  const rows = Math.max(1, Math.ceil(list.length / PER_ROW));
  const level = list.length === 0 ? 12 : Math.max(20, rows * 10 + 14);
  const top = 135.25 - level;
  const front = [wave(top, 1, 4), wave(top, -1, 4)];
  const back = [wave(top - 3, -1, 3), wave(top - 3, 1, 3)];
  const edge = rainbow ? { stroke: `url(#rb-${uid})` } : undefined;

  return (
    <span className={cx("nx-glass", pending && "nx-glass--pending", privacy && "nx-glass--privacy")}>
      <svg viewBox="0 0 136 136" className="nx-glass__svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`fr-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="nx-glass__frost-a" />
            <stop offset="1" className="nx-glass__frost-b" />
          </linearGradient>
          <linearGradient id={`gl-${uid}`} x1="0" y1="0" x2="0.7" y2="0.9">
            <stop offset="0" className="nx-glass__gloss" />
            <stop offset="0.55" className="nx-glass__gloss-end" />
          </linearGradient>
          {rainbow && (
            <linearGradient id={`rb-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ef4444" />
              <stop offset="0.2" stopColor="#f97316" />
              <stop offset="0.4" stopColor="#eab308" />
              <stop offset="0.6" stopColor="#22c55e" />
              <stop offset="0.8" stopColor="#3b82f6" />
              <stop offset="1" stopColor="#8b5cf6" />
              {!reduced && (
                <animateTransform attributeName="gradientTransform" type="rotate" from="0 0.5 0.5" to="360 0.5 0.5" dur="6s" repeatCount="indefinite" />
              )}
            </linearGradient>
          )}
        </defs>
        <polygon points={TOP} className="nx-glass__top" />
        <polygon points={SIDE} className="nx-glass__side" />
        <polygon points={FRONT} fill={`url(#fr-${uid})`} />
        <path d={back[0]} className="nx-glass__liquid-back">
          {!reduced && <animate attributeName="d" values={`${back[0]};${back[1]};${back[0]}`} dur="5s" repeatCount="indefinite" />}
        </path>
        <path d={front[0]} className="nx-glass__liquid">
          {!reduced && <animate attributeName="d" values={`${front[0]};${front[1]};${front[0]}`} dur="4s" repeatCount="indefinite" />}
        </path>
        <polygon points={FRONT} fill={`url(#gl-${uid})`} />
        <polygon points={TOP} className="nx-glass__edge" style={edge} />
        <polygon points={SIDE} className="nx-glass__edge" style={edge} />
        <polygon points={FRONT} className="nx-glass__edge" style={edge} />
      </svg>
      <span className="nx-glass__face">
        {list.map((bubble, index) => (
          <span
            key={index}
            className={"nx-bubble nx-bubble--" + bubble.group}
            style={{ left: bubble.left, bottom: bubble.bottom, width: bubble.size, height: bubble.size }}
          />
        ))}
        <span className="nx-glass__text">
          {lines[0] && <span className="text-[10px] font-semibold text-muted sm:text-[11px]">{lines[0]}</span>}
          <span className="hidden min-h-[13px] text-[10.5px] text-subtle sm:block">{lines[1]}</span>
          <span className="mt-0.5 text-sm font-bold text-base-content tabular-nums sm:text-base">{formatBytes(size)}</span>
          <span className="text-[11px] text-muted sm:text-xs">{plural(count, "tx", "txs")}</span>
        </span>
        {(rainbow || privacy) && (
          <span className="nx-glass__badges">
            {rainbow && (
              <span className="nx-glass__badge nx-glass__badge--asset" title="An asset was created in this block">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                </svg>
              </span>
            )}
            {privacy && (
              <span className="nx-glass__badge nx-glass__badge--privacy" title="Coins entered or left a privacy pool">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
            )}
          </span>
        )}
      </span>
    </span>
  );
}

function MinedBlock({ block, entering }: { block: StripBlock; entering: boolean }) {
  const onlyCoinbase = block.txCount <= 1;
  //Fees of very large blocks are not added up for the strip: then the line is left out
  const top = onlyCoinbase ? "coinbase only" : rateText(block.feeRate) || (block.fees ? "fees " + formatAmount(block.fees) : null);
  const second = onlyCoinbase ? null : spanText(block.feeRate) || (block.fees ? formatAmount(block.fees) + " XNA" : null);
  const notes = [block.assetCreated && "an asset was created", block.privacy && "privacy pool activity"].filter(Boolean);
  const label =
    `Block ${formatNumber(block.height)}: ${plural(block.txCount, "transaction")}, ${formatBytes(block.size)}` +
    (block.fees ? `, ${formatAmount(block.fees)} XNA in fees` : "") +
    (notes.length ? ", " + notes.join(", ") : "");
  return (
    <a
      href={paths.block(block.height)}
      aria-label={label}
      className={cx("flex shrink-0 snap-start flex-col items-center gap-1.5 no-underline hover:no-underline", entering && "nx-cube-enter")}
    >
      <span className="font-mono text-[13px] font-semibold text-link tabular-nums">#{formatNumber(block.height)}</span>
      <GlassCube
        rainbow={block.assetCreated}
        privacy={block.privacy}
        lines={[top, second]}
        size={block.size}
        count={block.txCount}
        mix={block.mix}
        seed={block.height}
      />
      <span className="text-xs text-subtle">
        <RelativeTime time={block.time} />
      </span>
    </a>
  );
}

function NextBlock({ data }: { data: ChainStripData }) {
  const now = useNow();
  const { mempool } = data;
  let when = "—";
  if (data.avgBlockTime) {
    const left = data.tip.time + data.avgBlockTime - now / 1000;
    if (left > 1) {
      const d = formatDuration(left);
      when = "in ~" + (d.unit === "s" ? Math.round(left) + " s" : d.value + " " + d.unit);
    } else {
      when = "any moment";
    }
  }
  const top = mempool.count === 0 ? "empty" : rateText(mempool.feeRate) || "pending";
  const label = `Next block: ${plural(mempool.count, "transaction")} waiting, ${formatBytes(mempool.bytes)}, expected ${when}`;
  const mix = React.useMemo(() => ({ pending: mempool.count }), [mempool.count]);
  return (
    <a href={paths.mempool()} aria-label={label} className="flex shrink-0 snap-start flex-col items-center gap-1.5 no-underline hover:no-underline">
      <span className="text-[13px] font-semibold text-muted">Next block</span>
      <GlassCube pending lines={[top, spanText(mempool.feeRate)]} size={mempool.bytes} count={mempool.count} mix={mix} seed={7} />
      <span className="text-xs text-subtle tabular-nums">{when}</span>
    </a>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={"h-3 w-3 shrink-0 rounded-[3px] border-[1.5px] " + className} />
      {label}
    </span>
  );
}

function Dot({ group, label }: { group: Group; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={"inline-block h-2 w-2 shrink-0 nx-bubble nx-bubble--" + group} />
      {label}
    </span>
  );
}

export function ChainStrip({ data }: { data: ChainStripData }) {
  //Blocks that were not in the previous answer slide in. Worked out once per
  //answer, so other updates of the page (stats, prices) do not cut the slide short.
  const answer = React.useRef<ChainStripData | null>(null);
  const entering = React.useRef<Set<string>>(new Set());
  if (answer.current !== data) {
    const before = answer.current ? new Set(answer.current.blocks.map((block) => block.hash)) : null;
    entering.current = new Set(before ? data.blocks.filter((block) => !before.has(block.hash)).map((block) => block.hash) : []);
    answer.current = data;
  }

  //Only the blocks that fit, spread over the width: no scrollbar, no cut cube
  const minedRow = React.useRef<HTMLDivElement>(null);
  const fitting = useFittingCount(minedRow);
  const shown = data.blocks.slice(0, fitting);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-end gap-2.5 pt-2 pb-4 sm:gap-6" role="group" aria-label="The next block and the latest mined ones">
        <div className="shrink-0">
          <NextBlock data={data} />
        </div>
        <div aria-hidden="true" className="mb-6 h-[96px] w-0 shrink-0 border-l-2 border-dashed border-base-300 sm:h-[150px]" />
        <div
          ref={minedRow}
          className={cx(
            "flex min-w-0 flex-1 items-end gap-2.5 overflow-x-clip sm:gap-6",
            shown.length < data.blocks.length ? "justify-between" : "justify-start"
          )}
        >
          {shown.map((block) => (
            <div key={block.hash} className="shrink-0">
              <MinedBlock block={block} entering={entering.current.has(block.hash)} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
        <Swatch className="border-dashed border-[#10b981] bg-[#10b981]/15" label="Next block" />
        <Swatch className="border-brand bg-brand/15" label="Mined" />
        <Swatch className="border-transparent [background:linear-gradient(135deg,#ef4444,#eab308,#22c55e,#3b82f6,#8b5cf6)]" label="New asset" />
        <Swatch className="border-[#8b5cf6] bg-[#8b5cf6]/15" label="Privacy pool" />
        <span aria-hidden="true" className="hidden h-3.5 w-px bg-base-300 sm:block" />
        <Dot group="coinbase" label="Coinbase" />
        <Dot group="payment" label="Payment" />
        <Dot group="asset" label="Asset" />
        <Dot group="privacy" label="Privacy" />
      </div>
    </div>
  );
}
