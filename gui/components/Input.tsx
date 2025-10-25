import * as React from "react";

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

export function Input({
  label,
  placeholder,
  value,
  onChange,
  size = "md",
  width,
  clearable = false,
  bordered = true,
  type = "text",
}: InputProps) {
  const inputClass = `input ${bordered ? "input-bordered" : ""}`;
  const style = width ? { width } : {};

  return (
    <div className="input-wrapper" style={style}>
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
