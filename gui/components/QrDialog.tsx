import * as React from "react";
import qrcode from "qrcode-generator";
import { IconX } from "./Icons";
import { CopyButton } from "./ui";

/** Dark squares of the QR code as one SVG path */
function qrPath(text: string): { size: number; path: string } {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let path = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`;
    }
  }
  return { size, path };
}

/** The address as a QR code, in a native dialog (focus trap and Esc for free) */
export function QrDialog({ value, open, onClose }: { value: string; open: boolean; onClose: () => void }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const { size, path } = React.useMemo(() => qrPath(value), [value]);

  React.useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        //A click on the backdrop lands on the dialog element itself
        if (event.target === dialog.current) onClose();
      }}
      className="neurai-card m-auto w-[min(92vw,380px)] p-0 text-base-content backdrop:bg-black/55"
    >
      <div className="flex items-center justify-between gap-3 border-b border-base-300 px-5 py-3">
        <h2 id={titleId} className="m-0 text-base font-bold">
          Address QR code
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="nx-icon-btn h-10 w-10 border-0 bg-transparent">
          <IconX size={18} />
        </button>
      </div>
      <div className="flex flex-col items-center gap-4 px-5 py-5">
        {/* Always dark on white: scanners need the contrast whatever the theme */}
        <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className="h-auto w-full max-w-[260px] rounded-lg bg-white" role="img" aria-label={"QR code of " + value} shapeRendering="crispEdges">
          <path d={path} fill="#111827" />
        </svg>
        <div className="flex w-full items-center gap-1 rounded-[10px] border border-base-300 bg-sunken py-1 pl-3 pr-1">
          <span className="min-w-0 flex-1 font-mono text-[13px] break-all">{value}</span>
          <CopyButton value={value} label="Copy address" />
        </div>
      </div>
    </dialog>
  );
}
