import { Provider } from "urql";

import { PredictApp } from "@/components/predict/PredictApp/PredictApp";
import { startggClient } from "@/utils/startgg/client";

const PredictPage = () => {
  return (
    <Provider value={startggClient}>
      <PredictApp />
    </Provider>
  );
};

export default PredictPage;
