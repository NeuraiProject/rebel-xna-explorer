import * as React from "react";

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
  auto = false,
  flat = false,
  as: Component = "button",
  disabled = false,
  type = "button",
  className = "",
}: ButtonProps) {
  const btnClass = `btn ${flat ? "btn-flat" : "btn-primary"} ${className}`;

  if (Component === "button") {
    return (
      <button
        type={type}
        className={btnClass}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  }

  // Si es un componente Link u otro
  return (
    <Component className={btnClass} onClick={onClick}>
      {children}
    </Component>
  );
}
