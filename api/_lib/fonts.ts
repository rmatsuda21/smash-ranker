import { readFileSync } from "fs";

type SatoriFont = {
  name: string;
  data: Buffer;
  weight: 400 | 800;
};

let cached: SatoriFont[] | null = null;

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
