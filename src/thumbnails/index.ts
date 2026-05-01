import { ThumbnailDesign } from "@/types/thumbnail/ThumbnailDesign";
import { blankTemplate } from "./blank";
import { vsMatchTemplate } from "./vsMatch";
import { matchBannerTemplate } from "./matchBanner";

export type BuiltInTemplate = {
  id: string;
  name: string;
  build: (fontFamily?: string) => ThumbnailDesign;
};

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  { id: "vs-match", name: "VS Match", build: vsMatchTemplate },
  { id: "match-banner", name: "Match Banner", build: matchBannerTemplate },
  { id: "blank", name: "Blank", build: blankTemplate },
];

export { blankTemplate, vsMatchTemplate, matchBannerTemplate };
