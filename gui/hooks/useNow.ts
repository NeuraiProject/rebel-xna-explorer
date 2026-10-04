import * as React from "react";

/*
  One clock for the whole page: every "12 s ago" moves on the same tick,
  with one timer however many of them are on screen.
*/
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

//Rounded to the second, so the snapshot only changes once per tick
function snapshot() {
  return Math.floor(Date.now() / 1000) * 1000;
}

export function useNow(): number {
  return React.useSyncExternalStore(subscribe, snapshot, snapshot);
}
