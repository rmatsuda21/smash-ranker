import Cookies from "js-cookie";
import { cacheExchange, Client, fetchExchange, Provider } from "urql";

import { COOKIES } from "@/consts/cookies";
import { Ranker } from "@/components/top8/Ranker/Ranker";

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

export const RankerPage = () => {
  return (
    <Provider value={client}>
      <Ranker />
    </Provider>
  );
};
