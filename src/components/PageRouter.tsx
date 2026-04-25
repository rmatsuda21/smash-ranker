import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";

import { Home } from "@/pages/home";
import { RankerPage } from "@/pages/ranker";

const TierPage = lazy(() => import("@/pages/tier"));
const PredictPage = lazy(() => import("@/pages/predict"));

export const PageRouter = () => {
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
    </Switch>
  );
};
