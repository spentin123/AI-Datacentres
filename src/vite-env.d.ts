/// <reference types="vite/client" />

declare module "react-globe.gl" {
  import * as React from "react";
  const Globe: React.ComponentType<Record<string, unknown>>;
  export default Globe;
}
