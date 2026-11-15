import { cacheExchange, Client, fetchExchange, Provider } from "urql";

import { PredictApp } from "@/components/predict/PredictApp/PredictApp";

const client = new Client({
  url: "https://api.start.gg/gql/alpha",
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = import.meta.env.VITE_START_GG_TOKEN;

    return {
      headers: { authorization: token ? `Bearer ${token}` : "" },
    };
  },
});

const PredictPage = () => {
  return (
    <Provider value={client}>
      <PredictApp />
    </Provider>
  );
};

export default PredictPage;
