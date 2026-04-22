import type { ReactNode } from "react";

export function CRTFlicker({ children }: { children: ReactNode }) {
  return <div className="crt-flicker">{children}</div>;
}
