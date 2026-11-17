import { useSyncExternalStore } from "react";

import {
  getTextMetricsVersion,
  subscribeTextMetrics,
} from "@/utils/top8/textMetrics";

/** A number that changes when text measurements may have gone stale. Add it
 *  to the dependencies of layout memoized on measured text. */
export const useTextMetricsVersion = () =>
  useSyncExternalStore(subscribeTextMetrics, getTextMetricsVersion);
