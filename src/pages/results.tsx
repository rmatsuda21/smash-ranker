import Cookies from "js-cookie";
import { cacheExchange, Client, fetchExchange, Provider } from "urql";

import { COOKIES } from "@/consts/cookies";
import { ResultsApp } from "@/components/results/ResultsApp/ResultsApp";

const client = new Client({
  url: "https://api.start.gg/gql/alpha",
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const cookie = Cookies.get(COOKIES.STARTGG_TOKEN);
    const token = cookie || import.meta.env.VITE_START_GG_TOKEN;

    return {
      headers: { authorization: token ? `Bearer ${token}` : "" },
    };
  },
});

const ResultsPage = () => {
  return (
    <Provider value={client}>
      <ResultsApp />
    </Provider>
  );
};

export default ResultsPage;
