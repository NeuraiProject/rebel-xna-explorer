import * as React from "react";

interface AvatarProps {
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  squared?: boolean;
  alt?: string;
}

export function Avatar({ src, size = "md", squared = false, alt = "" }: AvatarProps) {
  const sizeMap = {
    xs: "24px",
    sm: "32px",
    md: "40px",
    lg: "56px",
    xl: "72px",
  };

  const style: React.CSSProperties = {
    width: sizeMap[size],
    height: sizeMap[size],
    borderRadius: squared ? "8px" : "50%",
    objectFit: "cover",
    display: "inline-block",
    backgroundColor: "#27272a",
  };

  return <img src={src} alt={alt} style={style} />;
}
