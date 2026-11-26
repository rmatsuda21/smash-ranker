import { useEffect, useState } from "react";
import { useLingui } from "@lingui/react";

import { logWarning } from "@/utils/observability/log";

// Loads a catalog that is not part of the startup one (the recap's, the terms
// of service's) for the current language and says whether it is in. Nothing
// that uses its strings should render before then.
export const useLazyCatalog = (
  load: (locale: string) => Promise<void>,
  area: string,
): boolean => {
  const { i18n } = useLingui();
  const locale = i18n.locale;
  const [settled, setSettled] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    load(locale)
      .catch((err: unknown) => {
        logWarning(`${area} catalog failed to load`, {
          area,
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
  }, [load, area, locale]);

  return settled === locale;
};
