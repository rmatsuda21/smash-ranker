import { setPerson, setPersonOnce } from "@/utils/observability/log";

// Person state for "has this visitor ever saved a graphic". Call after every
// successful save, on every surface.
export const markExported = () => {
  const now = new Date().toISOString();
  setPersonOnce({ first_export_at: now });
  setPerson({ has_exported: true, last_export_at: now });
};
