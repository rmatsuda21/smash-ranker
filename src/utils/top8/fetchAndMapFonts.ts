export type Font = {
  fontFamily: string;
  variants: string[];
  files: Record<string, string>;
  isVariableFont: boolean;
};

export type FontList = Record<string, Font>;

type FontAxis = {
  tag: string;
  start: number;
  end: number;
};

type GoogleFont = {
  family: string;
  variants: string[];
  files: Record<string, string>;
  axes?: FontAxis[];
};

type GoogleFontsResponse = {
  items: GoogleFont[];
};

const createVariantFromAxis = (axis: FontAxis): string[] => {
  const variants: string[] = [];
  for (let weight = axis.start; weight <= axis.end; weight += 100) {
    variants.push(weight.toString());
  }
  return variants;
};

export const fetchFontFamily = async (fontFamily: string): Promise<Font> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GOOGLE_API_KEY is not defined");
  }

  const url = new URL("https://www.googleapis.com/webfonts/v1/webfonts");
  url.searchParams.set("family", fontFamily);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch font family: ${response.statusText}`);
  }

  const data: GoogleFontsResponse = await response.json();

  return {
    fontFamily: data.items[0].family,
    variants: data.items[0].variants,
    files: data.items[0].files,
    isVariableFont: Boolean(data.items[0].axes),
  };
};

export const fetchAndMapFonts = async ({
  limit = 100,
}: {
  limit?: number;
} = {}): Promise<FontList> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GOOGLE_API_KEY is not defined");
  }

  const url = new URL("https://www.googleapis.com/webfonts/v1/webfonts");
  // url.searchParams.set("capability", "VF");
  url.searchParams.set("subset", "japanese");
  url.searchParams.set("sort", "popularity");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch fonts: ${response.statusText}`);
  }

  const data: GoogleFontsResponse = await response.json();

  const fonts = data.items.slice(0, limit).reduce<FontList>((acc, font) => {
    const isVariableFont = Boolean(font.axes);
    const weightAxis = font.axes?.find((axis) => axis.tag === "wght");

    const variants =
      isVariableFont && weightAxis
        ? createVariantFromAxis(weightAxis)
        : font.variants;

    acc[font.family] = {
      fontFamily: font.family,
      variants,
      files: font.files,
      isVariableFont,
    };

    return acc;
  }, {});

  return fonts;
};
