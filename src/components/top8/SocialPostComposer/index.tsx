import { lazy } from "react";

export const LazySocialPostComposer = lazy(
  () => import("./SocialPostComposer"),
);
