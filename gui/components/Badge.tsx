import * as React from "react";
import { Chip } from "@heroui/react";

interface BadgeProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Badge({ children, size = "md" }: BadgeProps) {
  return <Chip size={size}>{children}</Chip>;
}
