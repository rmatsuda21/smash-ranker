import { icon } from "./icons";
import type { ToolId } from "./links";

// Text from `_locales/<language>/messages.json`, in the browser's language.
export const t = (key: string): string => chrome.i18n.getMessage(key) || key;

const MESSAGE_KEYS: Record<ToolId, string> = {
  tournament: "toolTournament",
  ranker: "toolRanker",
  results: "toolResults",
  predict: "toolPredict",
  thumbnail: "toolThumbnail",
  tier: "toolTier",
  profile: "toolProfile",
};

export const toolLabel = (tool: ToolId) => t(MESSAGE_KEYS[tool]);
export const toolDescription = (tool: ToolId) => t(`${MESSAGE_KEYS[tool]}Desc`);

// Every tool, in the order the popup lists them.
export const ALL_TOOLS: readonly ToolId[] = [
  "ranker",
  "results",
  "predict",
  "thumbnail",
  "tier",
  "profile",
];

// A link to the site, opened in a new tab: the tournament site stays where
// the user left it.
export const linkTo = (url: string, className: string): HTMLAnchorElement => {
  const link = document.createElement("a");
  link.className = className;
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  return link;
};

// A tool's row: icon, name, and a line under it.
export const toolRow = (
  element: HTMLElement,
  tool: ToolId,
  note: string = toolDescription(tool),
): HTMLElement => {
  const box = document.createElement("span");
  box.className = "tool-icon";
  box.append(icon(tool));
  const text = document.createElement("span");
  text.className = "tool-text";
  const name = document.createElement("span");
  name.className = "tool-name";
  name.textContent = toolLabel(tool);
  const line = document.createElement("span");
  line.className = "tool-note";
  line.textContent = note;
  text.append(name, line);
  element.append(box, text);
  return element;
};
