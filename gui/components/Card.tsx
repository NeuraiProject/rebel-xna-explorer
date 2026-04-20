import * as React from "react";
import { Card as HeroCard, Separator } from "@heroui/react";

interface CardProps {
  children: React.ReactNode;
  variant?: "bordered" | "shadow";
  css?: any;
}

export function Card({ children }: CardProps) {
  return <HeroCard>{children}</HeroCard>;
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <HeroCard.Header>{children}</HeroCard.Header>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <HeroCard.Content>{children}</HeroCard.Content>;
};

Card.Divider = function CardDivider() {
  return <Separator />;
};
