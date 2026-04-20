import * as React from "react";
import { Input as HeroInput } from "@heroui/react";

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  size?: "sm" | "md" | "lg" | "xl";
  width?: string;
  clearable?: boolean;
  bordered?: boolean;
  type?: string;
}

const sizeMap = { sm: "sm", md: "md", lg: "lg", xl: "lg" } as const;

export function Input({
  placeholder,
  value,
  onChange,
  size = "md",
  width,
  type = "text",
}: InputProps) {
  const style = width ? { width } : undefined;

  return (
    <HeroInput
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      type={type}
      size={sizeMap[size] ?? "md"}
      style={style}
      fullWidth={!width}
    />
  );
}
