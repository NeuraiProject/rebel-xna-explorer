import * as React from "react";

interface CardProps {
  children: React.ReactNode;
  variant?: "bordered" | "shadow";
  css?: any;
}

interface CardHeaderProps {
  children: React.ReactNode;
}

interface CardBodyProps {
  children: React.ReactNode;
}

export function Card({ children, variant = "bordered", css }: CardProps) {
  return <div className="card">{children}</div>;
}

Card.Header = function CardHeader({ children }: CardHeaderProps) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }: CardBodyProps) {
  return <div className="card-body">{children}</div>;
};

Card.Divider = function CardDivider() {
  return <hr className="card-divider" />;
};
