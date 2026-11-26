import { logEvent } from "@/utils/observability/log";

export type ToolLinkTool = "ranker" | "recap" | "predict" | "tournament";
export type ToolLinkSource = "home" | "profile" | "tournament";

// For a tool link's onClick: which tool was opened, and from where. Kept
// apart from the links themselves (`utils/user/toolLinks.ts`), which the
// browser extension bundles and which must not pull in analytics.
export const logToolLinkClick = (tool: ToolLinkTool, source: ToolLinkSource) =>
  logEvent("tool_link_click", { tool, source });
