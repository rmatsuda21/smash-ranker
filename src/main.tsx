import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

import "@/theme.scss";
import "@/reset.css";
import "@/index.css";

import { waitForServiceWorker } from "@/utils/waitForServiceWorker";
import { loadCatalog } from "@/i18n";

import App from "@/App";

(async () => {
  await loadCatalog("en");
  await waitForServiceWorker();
  inject();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <I18nProvider i18n={i18n}>
        <App />
      </I18nProvider>
    </StrictMode>
  );
})();
