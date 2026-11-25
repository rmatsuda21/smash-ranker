import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

import "@/theme.css";
import "@/reset.css";
import "@/index.css";

import { registerServiceWorker } from "@/utils/waitForServiceWorker";
import { loadCatalog } from "@/i18n";
import { PREF_KEYS } from "@/consts/prefKeys";
import { getPref } from "@/utils/prefs";
import { initSentry, reactErrorHandler } from "@/utils/observability/sentry";
import { initAnalytics } from "@/utils/observability/analytics";
import { logError } from "@/utils/observability/log";
import { isChunkLoadError, reloadForStaleChunk } from "@/utils/staleChunk";
import App from "@/App";

initSentry();
initAnalytics();

// A chunk that is gone after a deploy: reload once to get the new build. If
// that was already tried, the error goes on to the page's error boundary.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForStaleChunk()) event.preventDefault();
});

// Shown when the app cannot start at all, before React or the translations
// are in, so it is plain HTML in both languages.
const showStartupFailure = () => {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;font-family:system-ui,sans-serif;color:#e8e8ea;background:#0e0e10">
      <h1 style="font-size:20px;margin:0">Smash Ranker couldn't start</h1>
      <p style="margin:0;max-width:360px;line-height:1.5;color:#a0a0a8">Check your connection and reload the page.<br />接続を確認して、ページを再読み込みしてください。</p>
      <button id="startup-reload" style="padding:12px 24px;border:none;border-radius:999px;background:#ff3e7f;color:#fff;font:inherit;font-weight:600;cursor:pointer">Reload / 再読み込み</button>
    </div>`;
  document
    .getElementById("startup-reload")
    ?.addEventListener("click", () => window.location.reload());
};

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
    `%c${ASCII_LOGO}%c\n  Hey, curious dev — nice find!\n`,
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
    const savedLanguage = getPref(PREF_KEYS.LANGUAGE) || defaultLanguage;
    try {
      await loadCatalog(savedLanguage);
    } catch (error) {
      // A saved language the app no longer ships, or a catalog that failed
      // to load: English is better than no app.
      if (savedLanguage === "en") throw error;
      await loadCatalog("en");
    }

    const savedTheme = getPref(PREF_KEYS.THEME) || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedAccent = getPref(PREF_KEYS.ACCENT_COLOR) || "pink";
    document.documentElement.setAttribute("data-accent", savedAccent);
    if (savedAccent === "custom") {
      const customHex = getPref(PREF_KEYS.CUSTOM_ACCENT_COLOR) || "#ff6600";
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
    if (isChunkLoadError(error) && reloadForStaleChunk()) return;
    logError(error, { area: "startup", stage: "bootstrap" });
    showStartupFailure();
  }
})();
