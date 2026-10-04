import * as React from "react";
import { formatDateTime, middleEllipsis, timeAgo } from "../lib/format";
import { useNow } from "../hooks/useNow";
import type { ApiError } from "../hooks/useApi";
import { IconAlert, IconCheck, IconChevronLeft, IconChevronRight, IconCopy, IconInbox } from "./Icons";

function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}
export { cx };

/* ---------------------------------------------------------------------------
 * Card
 * ------------------------------------------------------------------------ */

interface CardProps {
  title?: React.ReactNode;
  /** h1 when the card's title is the page's title */
  heading?: "h1" | "h2";
  action?: React.ReactNode;
  /** No padding: for lists whose rows run edge to edge */
  flush?: boolean;
  className?: string;
  children?: React.ReactNode;
  id?: string;
  label?: string;
}

export function Card({ title, heading = "h2", action, flush = false, className, children, id, label }: CardProps) {
  const headingId = React.useId();
  const Heading = heading;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      aria-label={!title ? label : undefined}
      className={cx("neurai-card min-w-0", flush ? "overflow-hidden p-0" : "px-4 py-5 sm:px-7 sm:py-6", className)}
    >
      {title &&
        (flush ? (
          <div className="nx-card-head">
            <Heading id={headingId} className="nx-card-title">
              {title}
            </Heading>
            {action}
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between gap-3">
            <Heading id={headingId} className="nx-card-title">
              {title}
            </Heading>
            {action}
          </div>
        ))}
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * List row: icon · title and detail · value (the wallet's LIST_ROW)
 * ------------------------------------------------------------------------ */

interface ListRowProps {
  href?: string;
  icon: React.ReactNode;
  iconClassName?: string;
  title: React.ReactNode;
  titleExtra?: React.ReactNode;
  detail?: React.ReactNode;
  value?: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}

export function ListRow({ href, icon, iconClassName, title, titleExtra, detail, value, sub, className }: ListRowProps) {
  const content = (
    <>
      <span className={cx("nx-tile", iconClassName)}>{icon}</span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2 leading-6">
          <span className="nx-row__title min-w-0">{title}</span>
          {titleExtra}
        </span>
        {detail && <span className="nx-row__detail">{detail}</span>}
      </span>
      <span className="min-w-0 text-right">
        {value && (
          <span className="block truncate text-[13px] font-semibold leading-[22px] tabular-nums">{value}</span>
        )}
        {sub && <span className="block truncate text-xs leading-[17px] text-subtle">{sub}</span>}
      </span>
    </>
  );
  if (href) {
    return (
      <a href={href} className={cx("nx-row", className)}>
        {content}
      </a>
    );
  }
  return <div className={cx("nx-row", className)}>{content}</div>;
}

/* ---------------------------------------------------------------------------
 * Copy
 * ------------------------------------------------------------------------ */

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {}
  //Older browsers and plain http: a hidden textarea and the copy command
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(area);
  }
}

interface CopyButtonProps {
  value: string;
  /** What is copied, for the accessible name: "Copy transaction id" */
  label: string;
  showText?: boolean;
  className?: string;
}

export function CopyButton({ value, label, showText = false, className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    await writeClipboard(value);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border-0 bg-transparent text-subtle transition-colors hover:bg-base-300 hover:text-base-content",
        showText ? "h-9 px-3 text-[13px] font-semibold" : "h-10 w-10 sm:h-8 sm:w-8",
        className
      )}
    >
      {copied ? <IconCheck size={15} className="text-ok" /> : <IconCopy size={15} />}
      {showText && <span className={copied ? "text-ok" : undefined}>{copied ? "Copied" : "Copy"}</span>}
      <span className="nx-visually-hidden" role="status">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * Hashes and addresses
 * ------------------------------------------------------------------------ */

interface HashTextProps {
  value: string;
  href?: string;
  head?: number;
  tail?: number;
  /** Whole value, wrapped: for the subject of a page */
  full?: boolean;
  /** Whole value from sm up, shortened on phones */
  responsive?: boolean;
  copy?: string | false;
  /** Text colour instead of link colour, link colour on hover: for lists of addresses */
  plain?: boolean;
  className?: string;
}

export function HashText({ value, href, head = 8, tail = 6, full = false, responsive = false, copy = false, plain = false, className }: HashTextProps) {
  const short = middleEllipsis(value, head, tail);
  const render = (text: string, extra: string) =>
    href ? (
      <a href={href} title={value} className={cx("font-mono", plain && "text-base-content hover:text-link", extra)}>
        {text}
      </a>
    ) : (
      <span title={value} className={cx("font-mono", extra)}>
        {text}
      </span>
    );
  return (
    <span className={cx("inline-flex min-w-0 max-w-full items-center gap-0.5 align-middle", className)}>
      {full && render(value, "min-w-0 break-all")}
      {!full && responsive && (
        <>
          {render(short, "whitespace-nowrap sm:hidden")}
          {render(value, "hidden min-w-0 break-all sm:inline")}
        </>
      )}
      {!full && !responsive && render(short, "min-w-0 truncate whitespace-nowrap")}
      {copy && <CopyButton value={value} label={copy} />}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Chips and time
 * ------------------------------------------------------------------------ */

export function Chip({
  tone = "neutral",
  dot = false,
  pulse = false,
  title,
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "bad" | "accent" | "privacy" | "rainbow";
  dot?: boolean;
  pulse?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span title={title} className={cx("nx-chip", tone !== "neutral" && "nx-chip--" + tone)}>
      {dot && <span className={cx("nx-dot", pulse && "nx-pulse")} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function RelativeTime({ time, prefix = "" }: { time: number | null | undefined; prefix?: string }) {
  const now = useNow();
  if (!time) return <span>—</span>;
  return (
    <time dateTime={new Date(time * 1000).toISOString()} title={formatDateTime(time)}>
      {prefix}
      {timeAgo(time, now)}
    </time>
  );
}

/* ---------------------------------------------------------------------------
 * Loading, empty and error states
 * ------------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("nx-skeleton block", className)} />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="nx-row">
          <Skeleton className="h-9 w-9 rounded-[10px]" />
          <span className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </span>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 4, className }: { lines?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cx("neurai-card flex flex-col gap-3 px-4 py-5 sm:px-7 sm:py-6", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-1/2" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cx("h-3.5", i % 2 ? "w-3/4" : "w-5/6")} />
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="nx-tile h-11 w-11 sm:h-11 sm:w-11">
        <IconInbox size={20} />
      </span>
      <p className="m-0 font-semibold">{title}</p>
      {children && <div className="nx-prose max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  error,
  onRetry,
  children,
}: {
  title?: string;
  error?: ApiError | string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}) {
  const message = typeof error === "string" ? error : error?.message;
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-bad-soft text-bad">
        <IconAlert size={20} />
      </span>
      <p className="m-0 font-semibold">{title}</p>
      {message && <p className="m-0 max-w-lg text-sm break-words text-muted">{message}</p>}
      {children}
      {onRetry && (
        <button type="button" className="neurai-btn--secondary mt-2" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Details: label above value, in a grid (the wallet's ChainDetails)
 * ------------------------------------------------------------------------ */

export interface Detail {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  wide?: boolean;
}

export function DetailGrid({ items, className }: { items: Detail[]; className?: string }) {
  return (
    <dl className={cx("m-0 grid grid-cols-2 gap-x-4 border-t border-base-300 md:grid-cols-3 md:gap-x-7 lg:grid-cols-4", className)}>
      {items.map((item) => (
        <div key={item.label} className={cx("min-w-0 border-b border-base-300 py-3 sm:py-3.5", item.wide && "col-span-full")}>
          <dt className="mb-1 text-xs text-subtle">{item.label}</dt>
          <dd className="m-0 text-sm font-semibold break-words tabular-nums sm:text-[15px]">{item.value}</dd>
          {item.sub && <dd className="m-0 mt-0.5 text-xs text-subtle">{item.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------------------------
 * Raw JSON, folded away
 * ------------------------------------------------------------------------ */

export function RawJson({ title, data, note }: { title: string; data: unknown; note?: string }) {
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const text = React.useMemo(() => (open ? JSON.stringify(data, null, 2) : ""), [open, data]);
  return (
    <section className="neurai-card overflow-hidden p-0">
      <div className="flex items-center gap-2 pr-3 sm:pr-5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[52px] flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent px-4 py-3.5 text-left text-sm font-bold text-base-content sm:px-6"
        >
          <IconChevronRight size={16} className={cx("text-subtle transition-transform", open && "rotate-90")} />
          <span className="flex-1">{title}</span>
          {note && <span className="hidden text-xs font-medium text-subtle sm:inline">{note}</span>}
        </button>
        {open && <CopyButton value={text} label={"Copy " + title.toLowerCase()} showText />}
      </div>
      {open && (
        <div id={panelId} className="px-4 pb-4 sm:px-6 sm:pb-6">
          <pre className="m-0 max-h-[420px] overflow-auto rounded-[10px] border border-base-300 bg-sunken p-4 font-mono text-xs leading-relaxed text-muted sm:text-[12.5px]">
            {text}
          </pre>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Paging and segmented control
 * ------------------------------------------------------------------------ */

export function Pager({
  page,
  pages,
  onPage,
  previousLabel = "Newer",
  nextLabel = "Older",
  className,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className={cx("flex items-center justify-between gap-2 border-t border-base-300 px-3 py-3 sm:px-[18px]", className)}>
      <div className="flex gap-1">
        {page > 2 && (
          <button type="button" className="neurai-btn--ghost btn-sm hidden min-h-11 sm:inline-flex" onClick={() => onPage(1)}>
            First
          </button>
        )}
        <button type="button" className="neurai-btn--secondary btn-sm min-h-11" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <IconChevronLeft size={16} />
          {previousLabel}
        </button>
      </div>
      <span className="text-center text-xs text-subtle tabular-nums sm:text-sm">
        Page {page.toLocaleString("en-US")} of {pages.toLocaleString("en-US")}
      </span>
      <div className="flex gap-1">
        <button type="button" className="neurai-btn--secondary btn-sm min-h-11" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          {nextLabel}
          <IconChevronRight size={16} />
        </button>
        {page < pages - 1 && (
          <button type="button" className="neurai-btn--ghost btn-sm hidden min-h-11 sm:inline-flex" onClick={() => onPage(pages)}>
            Last
          </button>
        )}
      </div>
    </nav>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx("neurai-segmented neurai-segmented--sm overflow-x-auto", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cx("neurai-segmented__item min-h-9 cursor-pointer whitespace-nowrap border-0", option.value === value && "is-active")}
        >
          {option.label}
          {option.count !== undefined && <span className="ml-1.5 font-normal text-muted tabular-nums">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Breadcrumb
 * ------------------------------------------------------------------------ */

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="px-0.5 text-[13px] text-subtle">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        {items.map((item, index) => (
          <li key={index} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <a href={item.href} className="py-1">
                {item.label}
              </a>
            ) : (
              <span aria-current="page" className="truncate text-muted">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Page title in the browser tab */
export function useDocumentTitle(title: string | null) {
  React.useEffect(() => {
    document.title = title ? title + " · Rebel Explorer" : "Rebel Explorer · Neurai";
  }, [title]);
}
