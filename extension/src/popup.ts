import { PLATFORM_LABELS } from "@/consts/platforms";

import { icon } from "./icons";
import {
  EVENT_TOOLS,
  emptyToolUrl,
  eventToolLink,
  siteUrl,
  tournamentUrl,
  type ToolId,
} from "./links";
import { GET_PAGE, type GetPageMessage } from "./messages";
import { readTournamentPage, type TournamentPage } from "./pages";
import { getSettings, setShowButton } from "./settings";
import { ALL_TOOLS, linkTo, t, toolRow } from "./tools";

// The toolbar popup: the open tab's tournament and the tools that can load
// it, then every other tool, then the button's on/off switch.

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

// The tab's tournament, as its content script reads it. A tab opened before
// the extension was installed has no content script, so it is injected first:
// opening the popup grants that for the tab it was opened on (activeTab).
const readActiveTab = async (): Promise<TournamentPage | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab?.id;
  if (tabId === undefined) return null;

  const ask = async (): Promise<TournamentPage | null | undefined> => {
    try {
      const message: GetPageMessage = { type: GET_PAGE };
      return await chrome.tabs.sendMessage(tabId, message);
    } catch {
      return undefined; // Nothing listening in the tab.
    }
  };

  const answer = await ask();
  if (answer !== undefined) return answer;
  if (!tab.url || !readTournamentPage(tab.url, null)) return null;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch {
    return null; // A page Chrome keeps extensions out of.
  }
  return (await ask()) ?? null;
};

const header = (): HTMLElement => {
  const head = el("header", "head");
  const brand = linkTo(siteUrl("/"), "brand");
  brand.append(icon("logo"), "Smash Ranker");
  const open = linkTo(siteUrl("/"), "icon-link");
  open.append(icon("external"));
  open.title = t("popupOpenSite");
  open.setAttribute("aria-label", t("popupOpenSite"));
  head.append(brand, open);
  return head;
};

// The open tab's tournament, with the tools that load it. Returns the tools
// shown here, which the list below leaves out.
const tournamentSection = (
  page: TournamentPage,
): { section: HTMLElement; shown: Set<ToolId> } => {
  const section = el("section", "tournament");
  const shown = new Set<ToolId>();

  const title = el("div", "tournament-head");
  title.append(
    el("h1", "tournament-name", page.name ?? t("popupThisTournament")),
  );
  const sub = [page.eventName, PLATFORM_LABELS[page.platform]]
    .filter(Boolean)
    .join(" · ");
  title.append(el("p", "tournament-sub", sub));
  section.append(title);

  const tournament = tournamentUrl(page);
  if (tournament) {
    const primary = linkTo(tournament, "primary");
    primary.append(icon("tournament"), el("span", "", t("toolTournament")));
    section.append(primary);
  }

  const list = el("div", "list");
  let needsEvent = false;
  for (const tool of EVENT_TOOLS) {
    const link = eventToolLink(page, tool);
    if (link.status === "ready") {
      list.append(toolRow(linkTo(link.url, "item"), tool));
      shown.add(tool);
    }
    if (link.status === "needsEvent") needsEvent = true;
  }
  if (list.childElementCount) section.append(list);
  if (needsEvent) section.append(el("p", "hint", t("needsEvent")));
  return { section, shown };
};

const toolsSection = (heading: string, tools: ToolId[]): HTMLElement => {
  const section = el("section", "tools");
  section.append(el("h2", "section-title", heading));
  const list = el("div", "list");
  for (const tool of tools) {
    list.append(toolRow(linkTo(emptyToolUrl(tool), "item"), tool));
  }
  section.append(list);
  return section;
};

const buttonSwitch = (showButton: boolean): HTMLElement => {
  const label = el("label", "switch");
  const input = el("input", "");
  input.type = "checkbox";
  input.setAttribute("role", "switch");
  input.checked = showButton;
  input.addEventListener("change", () => void setShowButton(input.checked));
  label.append(input, el("span", "", t("popupShowButton")));
  const footer = el("footer", "foot");
  footer.append(label);
  return footer;
};

const main = async () => {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  const app = document.getElementById("app")!;
  const [page, settings] = await Promise.all([readActiveTab(), getSettings()]);

  const parts: HTMLElement[] = [header()];
  let shown = new Set<ToolId>();
  if (page) {
    const tournament = tournamentSection(page);
    shown = tournament.shown;
    parts.push(tournament.section);
  } else {
    parts.push(el("p", "intro", t("popupNoPage")));
  }
  const rest = ALL_TOOLS.filter((tool) => !shown.has(tool));
  parts.push(
    toolsSection(t(shown.size ? "popupOtherTools" : "popupAllTools"), rest),
    buttonSwitch(settings.showButton),
  );
  app.replaceChildren(...parts);
};

void main();
