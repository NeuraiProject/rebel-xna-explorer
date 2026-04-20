import * as React from "react";
import { Link as HeroLink } from "@heroui/react";

interface LinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  css?: any;
  target?: string;
}

export function Link({ children, href, onClick, css, target }: LinkProps) {
  const style: React.CSSProperties = {};
  if (css?.marginLeft) style.marginLeft = css.marginLeft;

  if (href) {
    return (
      <HeroLink href={href} style={style} onClick={onClick} target={target}>
        {children}
      </HeroLink>
    );
  }

  return (
    <span style={style} onClick={onClick}>
      {children}
    </span>
  );
}
