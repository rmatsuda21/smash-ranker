import { loadRecapCatalog } from "@/i18n";
import { useLazyCatalog } from "@/hooks/useLazyCatalog";

// Loads the recap's own translations for the current language and says
// whether they are in. Nothing in the recap should render text before then.
export const useRecapCatalog = (): boolean =>
  useLazyCatalog(loadRecapCatalog, "recap");
