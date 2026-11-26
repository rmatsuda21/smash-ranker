import styles from "./content.css" with { type: "text" };
import { icon } from "./icons";
import { EVENT_TOOLS, eventToolLink, tournamentUrl } from "./links";
import { GET_PAGE } from "./messages";
import { readTournamentPage, type TournamentPage } from "./pages";
import { getSettings, onShowButtonChange, setShowButton } from "./settings";
import { linkTo, t, toolRow } from "./tools";

// The floating "Open in Smash Ranker" button on tournament pages, with a list
// of the tools that can load the page's event. It lives in a closed shadow
// root, so the page's styles and scripts leave it alone.

const HOST_TAG = "smash-ranker-button";
const MENU_ID = "smash-ranker-menu";
const LOADED = Symbol.for("smash-ranker/content");

// The tools for one page, under its name.
const buildMenu = (page: TournamentPage, close: () => void): HTMLElement => {
  const panel = document.createElement("div");
  panel.className = "menu";
  panel.id = MENU_ID;

  const head = document.createElement("div");
  head.className = "menu-head";
  const title = document.createElement("span");
  title.className = "menu-title";
  title.textContent = page.name ?? t("menuTitle");
  head.append(title);
  if (page.eventName) {
    const event = document.createElement("span");
    event.className = "menu-sub";
    event.textContent = page.eventName;
    head.append(event);
  }
  panel.append(head);

  const tournament = tournamentUrl(page);
  if (tournament)
    panel.append(toolRow(linkTo(tournament, "item"), "tournament"));
  let needsEvent = false;
  for (const tool of EVENT_TOOLS) {
    const link = eventToolLink(page, tool);
    if (link.status === "ready") {
      panel.append(toolRow(linkTo(link.url, "item"), tool));
    }
    if (link.status === "needsEvent") needsEvent = true;
  }
  for (const item of panel.querySelectorAll("a")) {
    item.addEventListener("click", close);
  }

  if (needsEvent) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = t("needsEvent");
    panel.append(hint);
  }

  const hide = document.createElement("button");
  hide.type = "button";
  hide.className = "hide";
  hide.title = t("menuHideHint");
  hide.append(icon("hide"), t("menuHide"));
  hide.addEventListener("click", () => void setShowButton(false));
  panel.append(hide);
  return panel;
};

// The button: on a page the site has a tournament page for, a link to it
// with an arrow beside it that opens the tools; elsewhere (Challonge,
// Tonamel) one button that opens them.
const buildPill = (
  page: TournamentPage,
): { pill: HTMLElement; toggle: HTMLButtonElement } => {
  const pill = document.createElement("div");
  pill.className = "pill";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", MENU_ID);

  const tournament = tournamentUrl(page);
  if (tournament) {
    const main = linkTo(tournament, "main");
    main.append(icon("logo"), t("buttonOpen"));
    toggle.className = "more";
    toggle.setAttribute("aria-label", t("buttonMore"));
    toggle.title = t("buttonMore");
    toggle.append(icon("chevron"));
    pill.append(main, toggle);
  } else {
    toggle.className = "main";
    const chevron = document.createElement("span");
    chevron.className = "chevron";
    chevron.append(icon("chevron"));
    toggle.append(icon("logo"), t("buttonTools"), chevron);
    pill.append(toggle);
  }
  return { pill, toggle };
};

const start = () => {
  // The popup injects this script into tabs opened before the extension was
  // installed; a tab that already runs it keeps the copy it has.
  const scope = globalThis as { [LOADED]?: boolean };
  if (scope[LOADED]) return;
  scope[LOADED] = true;

  // A button left by an older version of the extension (one updated or
  // reloaded while the tab stayed open) is replaced.
  document.querySelectorAll(HOST_TAG).forEach((element) => element.remove());

  const host = document.createElement(HOST_TAG);
  const root = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = styles;
  const container = document.createElement("div");
  container.className = "root";
  root.append(style, container);

  let page: TournamentPage | null = null;
  let show = false;
  let href = "";
  let toggle: HTMLButtonElement | null = null;
  let menu: HTMLElement | null = null;

  const setOpen = (open: boolean) => {
    if (!page || !toggle || open === Boolean(menu)) return;
    toggle.setAttribute("aria-expanded", String(open));
    container.dataset.open = String(open);
    if (open) {
      menu = buildMenu(page, () => setOpen(false));
      container.append(menu);
    } else {
      menu?.remove();
      menu = null;
    }
  };

  // Builds the button for the current page, closed, or takes it away.
  const render = () => {
    menu = null;
    toggle = null;
    if (!page || !show) {
      host.remove();
      return;
    }
    const built = buildPill(page);
    toggle = built.toggle;
    toggle.addEventListener("click", () => setOpen(!menu));
    host.dataset.platform = page.platform;
    container.dataset.open = "false";
    container.replaceChildren(built.pill);
    if (!host.isConnected) document.documentElement.append(host);
  };

  // The extension was updated or removed while the page stayed open: this
  // copy can no longer reach it, so it takes its button away.
  const isOrphaned = () => !chrome.runtime?.id;

  // Tournament sites change pages without loading a new document.
  const checkAddress = () => {
    if (isOrphaned()) {
      host.remove();
      clearInterval(timer);
      return;
    }
    if (location.href === href) return;
    href = location.href;
    page = readTournamentPage(href, document);
    render();
  };
  // The Navigation API reports every change of address; the interval is the
  // fallback where it is missing.
  const navigation = (window as { navigation?: EventTarget }).navigation;
  navigation?.addEventListener("currententrychange", checkAddress);
  const timer = navigation ? undefined : setInterval(checkAddress, 1000);
  checkAddress();

  // The page's title, which holds the tournament's name, often changes after
  // its address.
  new MutationObserver(() => {
    if (!page || isOrphaned()) return;
    const next = readTournamentPage(location.href, document);
    if (next?.name === page.name) return;
    page = next;
    if (menu) {
      setOpen(false);
      setOpen(true);
    }
  }).observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  document.addEventListener("pointerdown", (event) => {
    if (menu && !event.composedPath().includes(host)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (!menu || event.key !== "Escape") return;
    setOpen(false);
    toggle?.focus();
  });

  onShowButtonChange((showButton) => {
    show = showButton;
    render();
  });
  void (async () => {
    ({ showButton: show } = await getSettings());
    render();
  })();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== GET_PAGE) return;
    sendResponse(readTournamentPage(location.href, document));
  });
};

start();
