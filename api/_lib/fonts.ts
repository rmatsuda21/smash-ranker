import { readFileSync } from "fs";

type SatoriFont = {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 700 | 800;
};

let cached: SatoriFont[] | null = null;
let cachedPath: SatoriFont[] | null = null;

// Read on first use, not at module load. A function that throws while its
// module is loading dies before `withLogging` runs, so the failure reaches
// neither Sentry nor the structured logs (only Vercel's raw runtime log).
// Loading here keeps a missing or unreadable font inside the handler.
//
// The paths are `new URL(..., import.meta.url)` literals on purpose: functions
// run as ES modules (no `__dirname`), and Vercel's file tracer follows this
// pattern to bundle the .ttf files with each function.
export const getSatoriFonts = (): SatoriFont[] => {
  if (cached) return cached;
  cached = [
    {
      name: "M PLUS Rounded 1c",
      data: readFileSync(
        new URL("../fonts/MPLUSRounded1c-Regular.ttf", import.meta.url),
      ),
      weight: 400,
    },
    {
      name: "M PLUS Rounded 1c",
      data: readFileSync(
        new URL("../fonts/MPLUSRounded1c-ExtraBold.ttf", import.meta.url),
      ),
      weight: 800,
    },
  ];
  return cached;
};

// Fonts for the results graphic's Path layout: Barlow for text and Barlow
// Condensed for numerals and labels. Barlow has no Japanese, so M PLUS Rounded
// 1c follows them: satori takes a glyph a font lacks from the next font in the
// list.
export const getPathFonts = (): SatoriFont[] => {
  if (cachedPath) return cachedPath;
  cachedPath = [
    {
      name: "Barlow",
      data: readFileSync(
        new URL("../fonts/Barlow-Regular.ttf", import.meta.url),
      ),
      weight: 400,
    },
    {
      name: "Barlow",
      data: readFileSync(
        new URL("../fonts/Barlow-SemiBold.ttf", import.meta.url),
      ),
      weight: 600,
    },
    {
      name: "Barlow Condensed",
      data: readFileSync(
        new URL("../fonts/BarlowCondensed-SemiBold.ttf", import.meta.url),
      ),
      weight: 600,
    },
    {
      name: "Barlow Condensed",
      data: readFileSync(
        new URL("../fonts/BarlowCondensed-Bold.ttf", import.meta.url),
      ),
      weight: 700,
    },
    ...getSatoriFonts(),
  ];
  return cachedPath;
};
