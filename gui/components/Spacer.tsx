import * as React from "react";

interface SpacerProps {
  y?: number;
  x?: number;
}

export function Spacer({ y = 1, x }: SpacerProps) {
  const height = y ? `${y * 16}px` : undefined;
  const width = x ? `${x * 16}px` : undefined;

  return <div className="spacer" style={{ height, width }} />;
}
