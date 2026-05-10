import { SpeedInsights } from "@vercel/speed-insights/react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout/Layout";
import { PageRouter } from "@/components/PageRouter";
import { FeatureFlagsProvider } from "@/components/FeatureFlagsProvider";
import { ToastProvider } from "@/components/Toast";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <FeatureFlagsProvider>
          <Layout>
            <PageRouter />
          </Layout>
        </FeatureFlagsProvider>
      </ToastProvider>
      <SpeedInsights />
    </ErrorBoundary>
  );
}

export default App;
