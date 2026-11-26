import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";

import { RECAP_YEAR } from "@/consts/recap/recap";
import {
  useFeatureFlags,
  type FeatureFlagKey,
  type FeatureFlags,
} from "@/hooks/useFeatureFlags";

type PageName = { name: MessageDescriptor; flag?: FeatureFlagKey };

const recapYear = RECAP_YEAR;

// Each page's name in the browser tab: the menu's words where the menu has
// the page. The home page and the login return are the site's name alone.
const PAGE_NAMES: Record<string, PageName | null> = {
  "/": null,
  "/oauth/callback": null,
  "/ranker": { name: msg`Ranker` },
  "/tier": { name: msg`Tier List` },
  "/predict": { name: msg`Predictions` },
  "/results": { name: msg`Recap`, flag: "results-enabled" },
  "/recap": { name: msg`Recap ${recapYear}`, flag: "recap-enabled" },
  "/thumbnail": { name: msg`Thumbnail Maker`, flag: "thumbnail-enabled" },
  "/me": { name: msg`Profile` },
  "/tos": { name: msg`Terms of Service` },
};

const NOT_FOUND = msg`Page not found`;

const pageName = (
  path: string,
  flags: FeatureFlags,
): MessageDescriptor | null => {
  if (path.startsWith("/tournament/")) return msg`Tournament`;
  if (!(path in PAGE_NAMES)) return NOT_FOUND;
  const page = PAGE_NAMES[path];
  if (!page) return null;
  // A tool that is switched off shows the not-found page.
  return page.flag && !flags[page.flag] ? NOT_FOUND : page.name;
};

// Keeps the tab's title on the current page, in the current language. The
// edge middleware writes an English one into the HTML for crawlers; this
// takes over once the app runs.
export const useDocumentTitle = () => {
  const [path] = useLocation();
  const flags = useFeatureFlags();
  const { _ } = useLingui();

  const site = _(msg`Smash Ranker`);
  const page = pageName(path, flags);
  const title = page ? `${_(page)} | ${site}` : site;

  useEffect(() => {
    document.title = title;
  }, [title]);
};
