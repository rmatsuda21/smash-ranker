import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout/Layout";
import { PageRouter } from "@/components/PageRouter";

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <PageRouter />
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
