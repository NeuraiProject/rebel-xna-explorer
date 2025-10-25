import * as React from "react";

interface LinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  css?: any;
  target?: string;
}

export function Link({ children, href, onClick, css, target }: LinkProps) {
  const style: React.CSSProperties = {};

  if (css?.marginLeft) {
    style.marginLeft = css.marginLeft;
  }

  if (href) {
    return (
      <a href={href} style={style} onClick={onClick} target={target}>
        {children}
      </a>
    );
  }

  return (
    <span style={style} onClick={onClick}>
      {children}
    </span>
  );
}
