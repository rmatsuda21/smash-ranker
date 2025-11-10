function measureFont({
  fontName,
  fallbackFont,
  fontStyle = "normal",
  fontWeight = "400",
}: {
  fontName: string;
  fallbackFont: string;
  fontStyle?: string;
  fontWeight?: string;
}): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const sampleText = "The quick brown fox 0123456789";
  if (!ctx) return 0;

  ctx.font = `${fontStyle} ${fontWeight} 16px '${fontName}', ${fallbackFont}`;
  return ctx.measureText(sampleText).width;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadFont({
  fontName,
  fontStyle = "normal",
  fontWeight = "400",
  fontUrl = "",
}: {
  fontName: string;
  fontStyle?: string;
  fontWeight?: string;
  fontUrl?: string;
}): Promise<void> {
  if (loadedFonts[fontName] || !fontUrl) return;

  const styleElement = document.createElement("style");
  styleElement.textContent = `
    @font-face {
      font-family: '${fontName}';
      font-style: ${fontStyle};
      font-weight: ${fontWeight};
      src: url('${fontUrl}') format('truetype');
    }
  `;
  document.head.appendChild(styleElement);

  const hasFontsLoadSupport = !!(document.fonts && document.fonts.load);
  const arialWidth = measureFont({
    fontName: "Arial",
    fallbackFont: "Arial",
    fontStyle,
    fontWeight,
  });

  if (hasFontsLoadSupport) {
    try {
      await document.fonts.load(
        `${fontStyle} ${fontWeight} 16px '${fontName}'`
      );
      const newWidth = measureFont({
        fontName: fontName,
        fallbackFont: "Arial",
        fontStyle,
        fontWeight,
      });
      const shouldTrustChanges = arialWidth !== newWidth;
      if (shouldTrustChanges) {
        await delay(60);
        loadedFonts[fontName] = true;
        return;
      }
    } catch (e) {}
  }

  const timesWidth = measureFont({
    fontName: "Times",
    fallbackFont: "Times",
    fontStyle,
    fontWeight,
  });
  const lastWidth = measureFont({
    fontName: fontName,
    fallbackFont: "Arial",
    fontStyle,
    fontWeight,
  });
  const waitTime = 60;
  const timeout = 6000;
  const attemptsNumber = Math.ceil(timeout / waitTime);
  for (let i = 0; i < attemptsNumber; i++) {
    const newWidthArial = measureFont({
      fontName: fontName,
      fallbackFont: "Arial",
      fontStyle,
      fontWeight,
    });
    const newWidthTimes = measureFont({
      fontName: fontName,
      fallbackFont: "Times",
      fontStyle,
      fontWeight,
    });
    const somethingChanged =
      newWidthArial !== lastWidth ||
      newWidthArial !== arialWidth ||
      newWidthTimes !== timesWidth;
    if (somethingChanged) {
      await delay(60);
      loadedFonts[fontName] = true;
      return;
    }
    await delay(waitTime);
  }
  console.warn(`Timeout for loading font "${fontName}".`);
}

export const loadedFonts: Record<string, boolean> = {};
