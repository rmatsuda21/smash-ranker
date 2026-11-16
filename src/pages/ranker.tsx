import { Provider } from "urql";

import { Ranker } from "@/components/top8/Ranker/Ranker";
import { startggClient } from "@/utils/startgg/client";

export const RankerPage = () => {
  return (
    <Provider value={startggClient}>
      <Ranker />
    </Provider>
  );
};
