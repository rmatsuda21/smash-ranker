import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";

import { Home } from "@/pages/home";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

const RankerPage = lazy(() =>
  import("@/pages/ranker").then((m) => ({ default: m.RankerPage })),
);
const TierPage = lazy(() => import("@/pages/tier"));
const PredictPage = lazy(() => import("@/pages/predict"));
const ResultsPage = lazy(() => import("@/pages/results"));
const ThumbnailPage = lazy(() => import("@/pages/thumbnail"));
const TosPage = lazy(() => import("@/pages/tos"));

export const PageRouter = () => {
  const thumbnailEnabled = useFeatureFlag("thumbnail-enabled");
  const resultsEnabled = useFeatureFlag("results-enabled");

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ranker">
        <Suspense>
          <RankerPage />
        </Suspense>
      </Route>
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
      {resultsEnabled && (
        <Route path="/results">
          <Suspense>
            <ResultsPage />
          </Suspense>
        </Route>
      )}
      {thumbnailEnabled && (
        <Route path="/thumbnail">
          <Suspense>
            <ThumbnailPage />
          </Suspense>
        </Route>
      )}
      <Route path="/tos">
        <Suspense>
          <TosPage />
        </Suspense>
      </Route>
    </Switch>
  );
};
