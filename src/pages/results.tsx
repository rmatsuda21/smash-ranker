import { Provider } from "urql";

import { ResultsApp } from "@/components/results/ResultsApp/ResultsApp";
import { startggClient } from "@/utils/startgg/client";

const ResultsPage = () => {
  return (
    <Provider value={startggClient}>
      <ResultsApp />
    </Provider>
  );
};

export default ResultsPage;
