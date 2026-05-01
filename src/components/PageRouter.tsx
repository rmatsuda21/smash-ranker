import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";

import { Home } from "@/pages/home";
import { RankerPage } from "@/pages/ranker";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

const TierPage = lazy(() => import("@/pages/tier"));
const PredictPage = lazy(() => import("@/pages/predict"));
const ThumbnailPage = lazy(() => import("@/pages/thumbnail"));

export const PageRouter = () => {
  const thumbnailEnabled = useFeatureFlag("thumbnail-enabled");

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ranker" component={RankerPage} />
      <Route path="/tier">
        <Suspense>
          <TierPage />
        </Suspense>
      </Route>
      <Route path="/predict">
        <Suspense>
          <PredictPage />
        </Suspense>
      </Route>
      {thumbnailEnabled && (
        <Route path="/thumbnail">
          <Suspense>
            <ThumbnailPage />
          </Suspense>
        </Route>
      )}
    </Switch>
  );
};
