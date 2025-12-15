const colorStringToRgba = (
  color: string
): { r: number; g: number; b: number; a: number } => {
  const trimmed = color.trim().toLowerCase();

  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1);

    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (hex.length === 4) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;

    return {
      r: isNaN(r) ? 0 : r,
      g: isNaN(g) ? 0 : g,
      b: isNaN(b) ? 0 : b,
      a: isNaN(a) ? 1 : a,
    };
  }

  if (trimmed.startsWith("rgb")) {
    const match = trimmed.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/
    );
    if (match) {
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] !== undefined ? Number(match[4]) : 1,
      };
    }
  }

  if (trimmed.startsWith("hsl")) {
    const match = trimmed.match(
      /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/
    );
    if (match) {
      const h = Number(match[1]) / 360;
      const s = Number(match[2]) / 100;
      const l = Number(match[3]) / 100;
      const a = match[4] !== undefined ? Number(match[4]) : 1;

      if (s === 0) {
        const gray = Math.round(l * 255);
        return { r: gray, g: gray, b: gray, a };
      }

      const hueToRgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      return {
        r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
        g: Math.round(hueToRgb(p, q, h) * 255),
        b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
        a,
      };
    }
  }

  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.fillStyle = trimmed;
    const computed = ctx.fillStyle;

    if (computed.startsWith("#")) {
      return colorStringToRgba(computed);
    }
    if (computed.startsWith("rgb")) {
      const match = computed.match(/[\d.]+/g)?.map(Number);
      if (match && match.length >= 3) {
        return {
          r: match[0],
          g: match[1],
          b: match[2],
          a: match.length >= 4 ? match[3] : 1,
        };
      }
    }
  }

  return { r: 0, g: 0, b: 0, a: 1 };
};

export const rgbStringToAlphaHex = (color: string): string => {
  const { r, g, b, a } = colorStringToRgba(color);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const alphaHex = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
};
