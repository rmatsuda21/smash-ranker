import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";

import { Home } from "@/pages/home";
import { RankerPage } from "@/pages/ranker";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { logEvent } from "@/utils/observability/log";

const TierPage = lazy(() => import("@/pages/tier"));
const PredictPage = lazy(() => import("@/pages/predict"));
const ThumbnailPage = lazy(() => import("@/pages/thumbnail"));

export const PageRouter = () => {
  const thumbnailEnabled = useFeatureFlag("thumbnail-enabled");
  const [location] = useLocation();

  useEffect(() => {
    logEvent("route_view", { route: location });
  }, [location]);

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
