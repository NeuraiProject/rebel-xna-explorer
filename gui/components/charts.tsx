import * as React from "react";
import { formatAmount, toSatoshis } from "../lib/amount";
import { cx } from "./ui";

/*
  Hand-drawn chart, like the wallet's BalanceChart: one line is a few dozen
  lines of code, not worth a charting library in the bundle. One series, so
  the title names it and no legend is needed.
*/

/** Balance of an address over its history, by block height */
export function BalanceChart({ points, asset = "XNA" }: { points: { height: number; balance: string }[]; asset?: string }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const values = React.useMemo(() => points.map((p) => Number(toSatoshis(p.balance)) / 1e8), [points]);
  if (points.length < 2) return null;

  const width = 600;
  const height = 120;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (points.length - 1)) * width;
  const y = (v: number) => 8 + (1 - (v - min) / span) * (height - 16);
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const shown = hover ?? points.length - 1;

  const onMove = (event: React.MouseEvent) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (points.length - 1)));
  };

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-[13px] font-bold">{asset} balance over time</span>
        <span className="text-xs text-subtle tabular-nums">
          #{points[shown].height.toLocaleString("en-US")}: {formatAmount(points[shown].balance)} {asset}
        </span>
      </figcaption>
      <div ref={box} className="relative h-[120px]" onMouseMove={onMove} onMouseLeave={() => setHover(null)} aria-hidden="true">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block h-full w-full overflow-visible">
          <defs>
            <linearGradient id="nx-balance-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={height / 3} x2={width} y2={height / 3} stroke="var(--color-base-300)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1={(height / 3) * 2} x2={width} y2={(height / 3) * 2} stroke="var(--color-base-300)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="url(#nx-balance-fill)" />
          <path d={line} fill="none" stroke="var(--color-bar)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {hover !== null && (
          <span className="pointer-events-none absolute inset-y-0 w-px bg-base-content/30" style={{ left: (x(hover) / width) * 100 + "%" }} />
        )}
        <span
          className={cx("pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-base-200 bg-bar")}
          style={{ left: (x(shown) / width) * 100 + "%", top: (y(values[shown]) / height) * 100 + "%" }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-subtle tabular-nums">
        <span>#{points[0].height.toLocaleString("en-US")}</span>
        <span>#{points[points.length - 1].height.toLocaleString("en-US")}</span>
      </div>
    </figure>
  );
}
