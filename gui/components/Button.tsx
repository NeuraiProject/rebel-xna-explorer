import * as React from "react";
import { Button as HeroButton } from "@heroui/react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  auto?: boolean;
  flat?: boolean;
  as?: any;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function Button({
  children,
  onClick,
  flat = false,
  disabled = false,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <HeroButton
      variant={flat ? "ghost" : "primary"}
      isDisabled={disabled}
      type={type}
      className={className}
      onClick={onClick}
    >
      {children}
    </HeroButton>
  );
}
