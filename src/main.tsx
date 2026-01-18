import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import Cookies from "js-cookie";

import "@/theme.scss";
import "@/reset.css";
import "@/index.css";

import { registerServiceWorker } from "@/utils/waitForServiceWorker";
import { loadCatalog } from "@/i18n";
import { COOKIES } from "@/consts/cookies";

import App from "@/App";

(async () => {
  // Load saved language preference or default to English
  const savedLanguage = Cookies.get(COOKIES.LANGUAGE) || "en";
  await loadCatalog(savedLanguage);

  // Apply saved theme preference
  const savedTheme = Cookies.get(COOKIES.THEME) || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // Apply saved accent color preference
  const savedAccent = Cookies.get(COOKIES.ACCENT_COLOR) || "pink";
  document.documentElement.setAttribute("data-accent", savedAccent);

  // Register service worker in the background (non-blocking)
  registerServiceWorker();

  inject();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <I18nProvider i18n={i18n}>
        <App />
      </I18nProvider>
    </StrictMode>
  );
})();
