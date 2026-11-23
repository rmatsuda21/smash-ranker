import { useEffect, useState } from "react";
import { useLingui } from "@lingui/react";

import { loadRecapCatalog } from "@/i18n";
import { logWarning } from "@/utils/observability/log";

// Loads the recap's own translations for the current language and says
// whether they are in. Nothing in the recap should render text before then.
export const useRecapCatalog = (): boolean => {
  const { i18n } = useLingui();
  const locale = i18n.locale;
  const [settled, setSettled] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadRecapCatalog(locale)
      .catch((err: unknown) => {
        logWarning("recap catalog failed to load", {
          area: "recap",
          error: err instanceof Error ? err.message : String(err),
        });
      })
      .then(() => {
        // Settled either way: untranslated text beats a blank screen.
        if (!cancelled) setSettled(locale);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return settled === locale;
};
