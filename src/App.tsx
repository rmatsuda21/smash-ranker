import { SpeedInsights } from "@vercel/speed-insights/react";

import { AppLoadingGate } from "@/components/AppLoadingGate/AppLoadingGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout/Layout";
import { PageRouter } from "@/components/PageRouter";
import { FeatureFlagsProvider } from "@/components/FeatureFlagsProvider";
import { ToastProvider } from "@/components/Toast";
import { renewSessionIfNeeded } from "@/utils/auth/session";

// Keep a start.gg login alive between visits.
renewSessionIfNeeded();

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <FeatureFlagsProvider>
          <AppLoadingGate>
            <Layout>
              <PageRouter />
            </Layout>
          </AppLoadingGate>
        </FeatureFlagsProvider>
      </ToastProvider>
      <SpeedInsights />
    </ErrorBoundary>
  );
}

export default App;
