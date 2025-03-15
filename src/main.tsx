import "@radix-ui/themes/styles.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import { Theme } from "@radix-ui/themes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme accentColor="sky" grayColor="slate" radius="small">
      <App />
    </Theme>
  </StrictMode>
);
