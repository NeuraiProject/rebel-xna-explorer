import * as React from "react";
import { Spinner } from "@heroui/react";

export function Loading() {
  return (
    <div className="loading-container">
      <Spinner />
    </div>
  );
}
