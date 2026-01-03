import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";

import "@/theme.scss";
import "@/reset.css";
import "@/index.css";

import { waitForServiceWorker } from "@/utils/waitForServiceWorker";

import App from "@/App";

waitForServiceWorker().then(() => {
  inject();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
