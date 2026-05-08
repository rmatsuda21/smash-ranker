export const FONTSOURCE_API = "https://api.fontsource.org/v1/fonts";

export const FONTSOURCE_CATALOG_URL = (() => {
  const url = new URL(FONTSOURCE_API);
  url.searchParams.set("subsets", "japanese");
  return url.toString();
})();

export const fontsourceCanvasCssUrl = (id: string): string =>
  `https://cdn.jsdelivr.net/npm/@fontsource/${id}@latest/japanese.css`;

export const fontsourcePreviewCssUrl = (id: string): string =>
  `https://cdn.jsdelivr.net/npm/@fontsource/${id}@latest/latin-400.css`;
