import { i18n } from "@lingui/core";

export async function loadCatalog(locale: string) {
  const { messages } = await import(`./locales/${locale}.ts`);
  i18n.loadAndActivate({ locale, messages });
}

// The recap's strings are a catalog of their own (lingui.recap.config.ts),
// added to the active one when the recap opens. `loadCatalog` replaces a
// locale's messages, so this has to run again after a change of language.
export async function loadRecapCatalog(locale: string) {
  const { messages } = await import(`./locales/recap/${locale}.ts`);
  i18n.load(locale, messages);
}
