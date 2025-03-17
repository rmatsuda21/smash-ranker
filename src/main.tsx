import "@radix-ui/themes/styles.css";
import "@/reset.css";
import "@/index.css";

import { FabricObject } from "fabric";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Setup custom properties for fabric objects
declare module "fabric" {
  interface FabricObject {
    id?: string;
    locked?: boolean;
    name?: string;
  }
  interface SerializedObjectProps {
    id?: string;
    locked?: boolean;
    name?: string;
  }
}

FabricObject.customProperties = ["name", "id", "locked"];
