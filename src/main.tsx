import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import Cookies from "js-cookie";

import "@/theme.css";
import "@/reset.css";
import "@/index.css";

import { registerServiceWorker } from "@/utils/waitForServiceWorker";
import { loadCatalog } from "@/i18n";
import { COOKIES } from "@/consts/cookies";
import { initSentry, reactErrorHandler } from "@/utils/observability/sentry";
import { initAnalytics } from "@/utils/observability/analytics";
import { logError } from "@/utils/observability/log";
import App from "@/App";

initSentry();
initAnalytics();

{
  const ASCII_LOGO = String.raw`
███████████████  ███████████████████████
███▀▀▀▀████████  ████████████████▀▀▀▀███
███    ████████  ████████████████    ███
███    ████████  ████████████████    ███
███    ████████  ████████████████    ███
████▄▄ ████████  ████████████████ ▄▄████
 ▀▀████████████  ████████████████████▀▀
     ▀▀████████  ████████████████▀▀
       ████████  ████████████████
       ████████  ████████████████
       ████████  ████████████████
        ▀██████  ██████████████▀
          ▀▀███  ███████████▀▀
             ▀▀  █████████▀
        ▄▄▄▄▄▄▄  █████████▄▄▄▄▄▄▄
       ████████  ████████████████
        ▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

       ████████  ████████████████
       ████████  ████████████████
`;
  console.log(
    `%c${ASCII_LOGO}%c\n  Hey, curious dev — nice find!\n  Want to help build Smash Ranker? Contribute at https://github.com/rmatsuda21/smash-ranker\n`,
    "color:#ff3e7f;font-family:ui-monospace,Menlo,monospace;font-weight:bold;line-height:1;",
    "color:#a0a0a8;font-family:ui-monospace,Menlo,monospace;font-size:12px;",
  );
}

(async () => {
  try {
    const supportedLanguages = ["en", "ja"];
    const browserLanguage = navigator.language.split("-")[0];
    const defaultLanguage = supportedLanguages.includes(browserLanguage)
      ? browserLanguage
      : "en";
    const savedLanguage = Cookies.get(COOKIES.LANGUAGE) || defaultLanguage;
    await loadCatalog(savedLanguage);

    const savedTheme = Cookies.get(COOKIES.THEME) || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedAccent = Cookies.get(COOKIES.ACCENT_COLOR) || "pink";
    document.documentElement.setAttribute("data-accent", savedAccent);
    if (savedAccent === "custom") {
      const customHex = Cookies.get(COOKIES.CUSTOM_ACCENT_COLOR) || "#ff6600";
      document.documentElement.style.setProperty("--accent-base", customHex);
    }

    await registerServiceWorker();

    inject();
    createRoot(document.getElementById("root")!, {
      onUncaughtError: reactErrorHandler,
      onCaughtError: reactErrorHandler,
      onRecoverableError: reactErrorHandler,
    }).render(
      <StrictMode>
        <I18nProvider i18n={i18n}>
          <App />
        </I18nProvider>
      </StrictMode>,
    );
  } catch (error) {
    logError(error, { stage: "bootstrap" });
    throw error;
  }
})();
