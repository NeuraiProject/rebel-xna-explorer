import * as React from "react";

interface BadgeProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Badge({ children, size = "md" }: BadgeProps) {
  return <span className={`badge badge-${size}`}>{children}</span>;
}
