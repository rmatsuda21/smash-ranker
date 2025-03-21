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

declare module "fabric" {
  interface Group {
    _objects: FabricObject[];
  }

  interface FabricObject {
    id?: string;
    locked?: boolean;
    name?: string;
    _objects: FabricObject[];
  }
  interface SerializedObjectProps {
    id?: string;
    locked?: boolean;
    name?: string;
    _objects: FabricObject[];
  }
}

FabricObject.customProperties = ["name", "id", "locked"];
