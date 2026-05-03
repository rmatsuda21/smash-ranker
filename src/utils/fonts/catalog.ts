import {
  FONTSOURCE_CATALOG_URL,
  familyToFontsourceId,
  fontsourceMetaUrl,
} from "./fontsourceUrls";

export type FontMeta = {
  fontFamily: string;
  id: string;
  weights: number[];
  isVariable: boolean;
};

type FontsourceFontResponse = {
  id: string;
  family: string;
  subsets: string[];
  weights: number[];
  styles: string[];
  defSubset: string;
  variable: boolean;
  category: string;
  license: string;
  type: string;
  lastModified: string;
};

const mapResponse = (data: FontsourceFontResponse): FontMeta => ({
  fontFamily: data.family,
  id: data.id,
  weights: data.weights.length > 0 ? [...data.weights].sort((a, b) => a - b) : [400],
  isVariable: data.variable,
});

export const fetchCatalog = async (): Promise<FontMeta[]> => {
  const response = await fetch(FONTSOURCE_CATALOG_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch font catalog: ${response.statusText}`);
  }
  const data: FontsourceFontResponse[] = await response.json();
  return data
    .filter((font) => font.subsets.includes("japanese"))
    .map(mapResponse)
    .sort((a, b) => a.fontFamily.localeCompare(b.fontFamily));
};

export const fetchFontMeta = async (family: string): Promise<FontMeta> => {
  const id = familyToFontsourceId(family);
  const response = await fetch(fontsourceMetaUrl(id));
  if (!response.ok) {
    throw new Error(`Failed to fetch font "${family}": ${response.statusText}`);
  }
  const data: FontsourceFontResponse = await response.json();
  return mapResponse(data);
};
