import { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoginGate } from "@/components/shared/LoginGate/LoginGate";
import { Home } from "@/pages/home";
import { NotFoundPage } from "@/pages/notFound";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

const RankerPage = lazy(() =>
  import("@/pages/ranker").then((m) => ({ default: m.RankerPage })),
);
const TierPage = lazy(() => import("@/pages/tier"));
const PredictPage = lazy(() => import("@/pages/predict"));
const ResultsPage = lazy(() => import("@/pages/results"));
const ThumbnailPage = lazy(() => import("@/pages/thumbnail"));
const RecapPage = lazy(() => import("@/pages/recap"));
const TosPage = lazy(() => import("@/pages/tos"));
const MePage = lazy(() => import("@/pages/me"));
const TournamentPage = lazy(() => import("@/pages/tournament"));
const OAuthCallbackPage = lazy(() => import("@/pages/oauthCallback"));

export const PageRouter = () => {
  const thumbnailEnabled = useFeatureFlag("thumbnail-enabled");
  const resultsEnabled = useFeatureFlag("results-enabled");
  const recapEnabled = useFeatureFlag("recap-enabled");

  const [location] = useLocation();

  // A page that fails to render or load is contained here, under the header,
  // and cleared when the user navigates somewhere else. The tools and
  // the tournament page sit behind `LoginGate`; the profile and the recap ask
  // for a login themselves.
  return (
    <ErrorBoundary variant="page" resetKey={location}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/ranker">
          <LoginGate>
            <Suspense>
              <RankerPage />
            </Suspense>
          </LoginGate>
        </Route>
        <Route path="/tier">
          <LoginGate>
            <Suspense>
              <TierPage />
            </Suspense>
          </LoginGate>
        </Route>
        <Route path="/predict">
          <LoginGate>
            <Suspense>
              <PredictPage />
            </Suspense>
          </LoginGate>
        </Route>
        {resultsEnabled && (
          <Route path="/results">
            <LoginGate>
              <Suspense>
                <ResultsPage />
              </Suspense>
            </LoginGate>
          </Route>
        )}
        {thumbnailEnabled && (
          <Route path="/thumbnail">
            <LoginGate>
              <Suspense>
                <ThumbnailPage />
              </Suspense>
            </LoginGate>
          </Route>
        )}
        {recapEnabled && (
          <Route path="/recap">
            <Suspense>
              <RecapPage />
            </Suspense>
          </Route>
        )}
        <Route path="/me">
          <Suspense>
            <MePage />
          </Suspense>
        </Route>
        <Route path="/tournament/:id">
          {(params) => (
            <LoginGate page="tournament">
              <Suspense>
                <TournamentPage id={params.id} />
              </Suspense>
            </LoginGate>
          )}
        </Route>
        <Route path="/oauth/callback">
          <Suspense>
            <OAuthCallbackPage />
          </Suspense>
        </Route>
        <Route path="/tos">
          <Suspense>
            <TosPage />
          </Suspense>
        </Route>
        {/* Anything else, including a tool that is switched off. */}
        <Route component={NotFoundPage} />
      </Switch>
    </ErrorBoundary>
  );
};
