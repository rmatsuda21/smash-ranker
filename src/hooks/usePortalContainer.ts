import { useSyncExternalStore } from "react";

import { getPortalContainer, subscribeToModalStack } from "@/utils/modalStack";

/** Where floating UI should portal to: the topmost open modal, else <body>. */
export const usePortalContainer = (): HTMLElement =>
  useSyncExternalStore(subscribeToModalStack, getPortalContainer);
