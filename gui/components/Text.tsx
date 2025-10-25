import * as React from "react";

interface TextProps {
  children: React.ReactNode;
  b?: boolean;
  size?: number;
  weight?: "normal" | "bold";
  css?: any;
}

export function Text({ children, b, size, weight, css }: TextProps) {
  const style: React.CSSProperties = {};

  if (size) {
    style.fontSize = `${size}px`;
  }

  if (weight === "bold" || b) {
    style.fontWeight = 600;
  }

  // Aplicar gradiente si está en css
  let className = "";
  if (css?.textGradient) {
    if (css.textGradient.includes("blue")) {
      className = "text-gradient-blue";
    } else if (css.textGradient.includes("yellow")) {
      className = "text-gradient-yellow";
    }
  }

  if (css?.display) {
    style.display = css.display;
  }

  if (css?.marginLeft) {
    style.marginLeft = css.marginLeft;
  }

  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
}
