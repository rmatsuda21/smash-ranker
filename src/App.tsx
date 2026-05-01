import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout/Layout";
import { PageRouter } from "@/components/PageRouter";
import { FeatureFlagsProvider } from "@/hooks/useFeatureFlags";

function App() {
  return (
    <ErrorBoundary>
      <FeatureFlagsProvider>
        <Layout>
          <PageRouter />
        </Layout>
      </FeatureFlagsProvider>
    </ErrorBoundary>
  );
}

export default App;
