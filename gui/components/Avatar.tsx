import * as React from "react";
import { Avatar as HeroAvatar } from "@heroui/react";

interface AvatarProps {
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  squared?: boolean;
  alt?: string;
}

const sizeMap = { xs: "sm", sm: "sm", md: "md", lg: "lg", xl: "lg" } as const;

export function Avatar({ src, size = "md", squared = false, alt = "" }: AvatarProps) {
  return (
    <HeroAvatar size={sizeMap[size]} className={squared ? "rounded-lg" : undefined}>
      <HeroAvatar.Image src={src} alt={alt} />
      <HeroAvatar.Fallback>{alt?.charAt(0)?.toUpperCase() || "?"}</HeroAvatar.Fallback>
    </HeroAvatar>
  );
}
