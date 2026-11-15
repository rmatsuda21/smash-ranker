/**
 * Paints a DOM subtree straight onto a canvas by reading each element's
 * measured box and computed style.
 *
 * This replaces DOM-snapshot libraries (html-to-image, modern-screenshot) for
 * the tier list export. Those clone every node, inline its styles, re-fetch
 * and base64-encode every <img>, then rasterise the result through an SVG
 * <foreignObject>; with ~90 character images that takes seconds. Here the
 * live layout is the source of truth and the already-decoded images are
 * drawn directly, so an export is a few milliseconds of canvas calls.
 *
 * It is deliberately NOT a general HTML renderer. It supports what the tier
 * list uses:
 *   - background colour and a single `linear-gradient()` layer
 *   - borders (uniform solid/dashed, or per-side as plain rectangles)
 *   - border-radius, `overflow: hidden` clipping, opacity
 *   - box-shadow (outer and inset) and a single text-shadow
 *   - wrapped text in direct text nodes
 *   - <img> with object-fit contain / cover / fill
 * Pseudo-elements, transforms, filters, background images and z-index
 * reordering are not handled. If the tier list starts using one of those in
 * exported content, add it here.
 */

type RenderOptions = {
  /** Output pixels per CSS pixel. */
  scale: number;
  /** Return true to skip an element and everything inside it. */
  ignore?: (el: Element) => boolean;
};

type Radii = [number, number, number, number]; // tl, tr, br, bl

type Shadow = {
  color: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  inset: boolean;
};

type PaintContext = {
  ctx: CanvasRenderingContext2D;
  originX: number;
  originY: number;
  scale: number;
  ignore: (el: Element) => boolean;
  images: Map<HTMLImageElement, HTMLImageElement | null>;
};

/** Far enough to move a shape fully off any canvas we'd create. */
const SHADOW_ONLY_OFFSET = 100_000;

const px = (value: string): number => Number.parseFloat(value) || 0;

const isTransparent = (color: string): boolean =>
  color === "transparent" ||
  /^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$/.test(color.trim());

/** Splits on top-level commas, leaving `rgba(1, 2, 3)` style groups intact. */
const splitTopLevel = (input: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const roundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: Radii,
) => {
  const limit = Math.max(0, Math.min(w, h) / 2);
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r, limit)));
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
};

const shrinkRadii = (radii: Radii, by: number): Radii =>
  radii.map((r) => Math.max(0, r - by)) as Radii;

/**
 * Computed box-shadow / text-shadow look like
 * `rgba(1, 2, 3, 0.25) 0px 0px 12px 2px, rgba(...) 0px 0px 8px 0px inset`.
 */
const parseShadows = (value: string): Shadow[] => {
  if (!value || value === "none") return [];
  const shadows: Shadow[] = [];
  for (const part of splitTopLevel(value)) {
    const inset = /\binset\b/.test(part);
    const withoutInset = part.replace(/\binset\b/, "").trim();
    const lengths = [...withoutInset.matchAll(/(-?[\d.]+)px/g)];
    if (lengths.length < 2) continue;
    const firstLength = lengths[0].index ?? 0;
    const lastLength = lengths[lengths.length - 1];
    const afterLengths = (lastLength.index ?? 0) + lastLength[0].length;
    // The colour sits before the lengths in computed style, but tolerate it
    // trailing them as authored CSS allows.
    const color =
      withoutInset.slice(0, firstLength).trim() ||
      withoutInset.slice(afterLengths).trim();
    const [x, y, blur = 0, spread = 0] = lengths.map((m) =>
      Number.parseFloat(m[1]),
    );
    if (!color || isTransparent(color)) continue;
    shadows.push({ color, x, y, blur, spread, inset });
  }
  return shadows;
};

/**
 * Draws only the shadow of `drawShape`: the shape itself is drawn far
 * off-canvas and its shadow is offset back into place. Canvas shadow offsets
 * and blur are in device pixels and ignore the transform, hence `scale`.
 */
const paintShadowOnly = (
  { ctx, scale }: PaintContext,
  shadow: Shadow,
  drawShape: (offsetX: number) => void,
  fillRule: CanvasFillRule = "nonzero",
) => {
  ctx.save();
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur * scale;
  ctx.shadowOffsetX = (shadow.x + SHADOW_ONLY_OFFSET) * scale;
  ctx.shadowOffsetY = shadow.y * scale;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  drawShape(-SHADOW_ONLY_OFFSET);
  ctx.fill(fillRule);
  ctx.restore();
};

const GRADIENT_SIDES: Record<string, number> = {
  "to top": 0,
  "to right": 90,
  "to bottom": 180,
  "to left": 270,
};

/** Returns the gradient direction as a unit vector, or null if unparseable. */
const parseGradientDirection = (
  token: string,
  w: number,
  h: number,
): { dx: number; dy: number } | null => {
  let degrees: number | undefined = GRADIENT_SIDES[token];

  if (degrees === undefined) {
    const angle = token.match(/^(-?[\d.]+)(deg|turn|rad|grad)$/);
    if (angle) {
      const n = Number.parseFloat(angle[1]);
      degrees =
        angle[2] === "deg"
          ? n
          : angle[2] === "turn"
            ? n * 360
            : angle[2] === "rad"
              ? (n * 180) / Math.PI
              : n * 0.9;
    }
  }

  if (degrees !== undefined) {
    const rad = (degrees * Math.PI) / 180;
    return { dx: Math.sin(rad), dy: -Math.cos(rad) };
  }

  // Corner keywords: the gradient line is perpendicular to the diagonal
  // joining the two *other* corners.
  if (token.startsWith("to ")) {
    const sx = token.includes("right") ? 1 : token.includes("left") ? -1 : 0;
    const sy = token.includes("bottom") ? 1 : token.includes("top") ? -1 : 0;
    const length = Math.hypot(sx * h, sy * w);
    if (length > 0) return { dx: (sx * h) / length, dy: (sy * w) / length };
  }

  return null;
};

/** `rgba(r, g, b, a)` → the same colour at alpha 0. */
const withZeroAlpha = (color: string): string => {
  const channels = color.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/,
  );
  return channels
    ? `rgba(${channels[1]}, ${channels[2]}, ${channels[3]}, 0)`
    : color;
};

const createLinearGradient = (
  ctx: CanvasRenderingContext2D,
  backgroundImage: string,
  x: number,
  y: number,
  w: number,
  h: number,
): CanvasGradient | null => {
  const match = backgroundImage.match(/^linear-gradient\((.*)\)$/s);
  if (!match) return null;

  const args = splitTopLevel(match[1]);
  let direction = parseGradientDirection(args[0], w, h);
  if (direction) args.shift();
  else direction = { dx: 0, dy: 1 }; // CSS default: to bottom
  if (args.length < 2) return null;

  const stops = args.map((arg) => {
    const position = arg.match(/\s(-?[\d.]+)%$/);
    return {
      color: position ? arg.slice(0, position.index).trim() : arg,
      offset: position ? Number.parseFloat(position[1]) / 100 : undefined,
    };
  });

  // Fill in missing positions the way CSS does: ends default to 0 and 1,
  // gaps are spread evenly between their positioned neighbours.
  stops[0].offset ??= 0;
  stops[stops.length - 1].offset ??= 1;
  for (let i = 1; i < stops.length - 1; i += 1) {
    if (stops[i].offset !== undefined) continue;
    let next = i + 1;
    while (stops[next].offset === undefined) next += 1;
    const from = stops[i - 1].offset!;
    const to = stops[next].offset!;
    for (let j = i; j < next; j += 1) {
      stops[j].offset = from + ((to - from) * (j - i + 1)) / (next - i + 1);
    }
  }

  // CSS fades to `transparent` in premultiplied space (the hue holds while
  // alpha drops). Canvas gradients don't, so a transparent stop would drag
  // the colour toward black. Give it its neighbour's hue at alpha 0.
  stops.forEach((stop, i) => {
    if (!isTransparent(stop.color)) return;
    const neighbour = stops[i - 1] ?? stops[i + 1];
    if (neighbour && !isTransparent(neighbour.color)) {
      stop.color = withZeroAlpha(neighbour.color);
    }
  });

  const { dx, dy } = direction;
  const length = Math.abs(w * dx) + Math.abs(h * dy);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const gradient = ctx.createLinearGradient(
    cx - (dx * length) / 2,
    cy - (dy * length) / 2,
    cx + (dx * length) / 2,
    cy + (dy * length) / 2,
  );

  try {
    let previous = 0;
    for (const stop of stops) {
      const offset = Math.min(1, Math.max(previous, stop.offset ?? 0));
      gradient.addColorStop(offset, stop.color);
      previous = offset;
    }
  } catch {
    // A stop syntax we don't parse (e.g. two positions on one stop).
    return null;
  }
  return gradient;
};

const paintBorder = (
  ctx: CanvasRenderingContext2D,
  style: CSSStyleDeclaration,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: Radii,
) => {
  const sides = [
    {
      width: px(style.borderTopWidth),
      color: style.borderTopColor,
      style: style.borderTopStyle,
    },
    {
      width: px(style.borderRightWidth),
      color: style.borderRightColor,
      style: style.borderRightStyle,
    },
    {
      width: px(style.borderBottomWidth),
      color: style.borderBottomColor,
      style: style.borderBottomStyle,
    },
    {
      width: px(style.borderLeftWidth),
      color: style.borderLeftColor,
      style: style.borderLeftStyle,
    },
  ].map((side) =>
    side.style === "none" ||
    side.style === "hidden" ||
    isTransparent(side.color)
      ? { ...side, width: 0 }
      : side,
  );

  const [top, right, bottom, left] = sides;
  if (sides.every((s) => s.width === 0)) return;

  const uniform = sides.every(
    (s) =>
      s.width === top.width && s.color === top.color && s.style === top.style,
  );

  if (uniform) {
    const bw = top.width;
    ctx.save();
    ctx.strokeStyle = top.color;
    ctx.lineWidth = bw;
    if (top.style === "dashed") ctx.setLineDash([bw * 3, bw * 3]);
    if (top.style === "dotted") ctx.setLineDash([bw, bw]);
    ctx.beginPath();
    roundedRectPath(
      ctx,
      x + bw / 2,
      y + bw / 2,
      w - bw,
      h - bw,
      shrinkRadii(radii, bw / 2),
    );
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Mixed borders: plain rectangles per side, clipped to the rounded box.
  ctx.save();
  ctx.beginPath();
  roundedRectPath(ctx, x, y, w, h, radii);
  ctx.clip();
  if (top.width) {
    ctx.fillStyle = top.color;
    ctx.fillRect(x, y, w, top.width);
  }
  if (bottom.width) {
    ctx.fillStyle = bottom.color;
    ctx.fillRect(x, y + h - bottom.width, w, bottom.width);
  }
  if (left.width) {
    ctx.fillStyle = left.color;
    ctx.fillRect(x, y, left.width, h);
  }
  if (right.width) {
    ctx.fillStyle = right.color;
    ctx.fillRect(x + w - right.width, y, right.width, h);
  }
  ctx.restore();
};

const paintImage = (
  { ctx, images }: PaintContext,
  el: HTMLImageElement,
  style: CSSStyleDeclaration,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  const source = images.get(el);
  if (!source || !source.naturalWidth || !source.naturalHeight) return;

  // Images are drawn into the content box.
  const left = px(style.borderLeftWidth) + px(style.paddingLeft);
  const top = px(style.borderTopWidth) + px(style.paddingTop);
  const boxW = w - left - px(style.borderRightWidth) - px(style.paddingRight);
  const boxH = h - top - px(style.borderBottomWidth) - px(style.paddingBottom);
  if (boxW <= 0 || boxH <= 0) return;

  const fit = style.objectFit;
  let drawW = boxW;
  let drawH = boxH;
  if (fit === "contain" || fit === "cover" || fit === "scale-down") {
    const ratio = source.naturalWidth / source.naturalHeight;
    const boxIsWider = boxW / boxH > ratio;
    const fitHeight = fit === "cover" ? !boxIsWider : boxIsWider;
    if (fitHeight) {
      drawH = boxH;
      drawW = boxH * ratio;
    } else {
      drawW = boxW;
      drawH = boxW / ratio;
    }
  } else if (fit === "none") {
    drawW = source.naturalWidth;
    drawH = source.naturalHeight;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + left, y + top, boxW, boxH);
  ctx.clip();
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    x + left + (boxW - drawW) / 2,
    y + top + (boxH - drawH) / 2,
    drawW,
    drawH,
  );
  ctx.restore();
};

type TextLine = { text: string; left: number; top: number; height: number };

/**
 * Recovers how the browser wrapped a text node by measuring each character,
 * so the canvas draws the same line breaks without re-implementing wrapping.
 */
const measureTextLines = (node: Text): TextLine[] => {
  const lines: TextLine[] = [];
  const range = document.createRange();
  let offset = 0;

  for (const char of node.data) {
    range.setStart(node, offset);
    range.setEnd(node, offset + char.length);
    offset += char.length;

    const rect = range.getClientRects()[0];
    // Whitespace collapsed at a wrap point has no box.
    if (!rect || (rect.width === 0 && !char.trim())) continue;

    const line = lines[lines.length - 1];
    if (line && Math.abs(rect.top - line.top) < rect.height / 2) {
      line.text += char;
    } else {
      lines.push({
        text: char,
        left: rect.left,
        top: rect.top,
        height: rect.height,
      });
    }
  }

  return lines;
};

const paintText = (
  { ctx, originX, originY, scale }: PaintContext,
  node: Text,
  style: CSSStyleDeclaration,
) => {
  if (!node.data.trim()) return;
  const lines = measureTextLines(node);
  if (lines.length === 0) return;

  ctx.save();
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.textAlign = "left";
  if (style.letterSpacing && style.letterSpacing !== "normal") {
    (
      ctx as CanvasRenderingContext2D & { letterSpacing?: string }
    ).letterSpacing = style.letterSpacing;
  }

  const [shadow] = parseShadows(style.textShadow);
  if (shadow) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur * scale;
    ctx.shadowOffsetX = shadow.x * scale;
    ctx.shadowOffsetY = shadow.y * scale;
  }

  // A text run's box is the font's ascent + descent, so the baseline can be
  // placed exactly when the browser reports font metrics.
  const metrics = ctx.measureText("x");
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  const hasFontMetrics = Number.isFinite(ascent) && Number.isFinite(descent);

  for (const line of lines) {
    const x = line.left - originX;
    const top = line.top - originY;
    if (hasFontMetrics) {
      ctx.textBaseline = "alphabetic";
      const baseline = top + (line.height - (ascent + descent)) / 2 + ascent;
      ctx.fillText(line.text, x, baseline);
    } else {
      ctx.textBaseline = "middle";
      ctx.fillText(line.text, x, top + line.height / 2);
    }
  }
  ctx.restore();
};

const paintElement = (paint: PaintContext, el: Element) => {
  if (paint.ignore(el)) return;

  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return;

  const { ctx } = paint;
  const rect = el.getBoundingClientRect();
  const x = rect.left - paint.originX;
  const y = rect.top - paint.originY;
  const w = rect.width;
  const h = rect.height;
  const hasBox = w > 0 && h > 0;

  ctx.save();
  const opacity = Number.parseFloat(style.opacity);
  if (Number.isFinite(opacity) && opacity < 1) ctx.globalAlpha *= opacity;

  const radii: Radii = [
    px(style.borderTopLeftRadius),
    px(style.borderTopRightRadius),
    px(style.borderBottomRightRadius),
    px(style.borderBottomLeftRadius),
  ];
  const borderTop = px(style.borderTopWidth);
  const borderRight = px(style.borderRightWidth);
  const borderBottom = px(style.borderBottomWidth);
  const borderLeft = px(style.borderLeftWidth);
  // Padding box: where gradients are positioned, inset shadows fall and
  // overflow clips.
  const padX = x + borderLeft;
  const padY = y + borderTop;
  const padW = w - borderLeft - borderRight;
  const padH = h - borderTop - borderBottom;
  const padRadii = shrinkRadii(
    radii,
    Math.max(borderTop, borderRight, borderBottom, borderLeft),
  );

  if (hasBox) {
    const shadows = parseShadows(style.boxShadow);

    for (const shadow of shadows.filter((s) => !s.inset)) {
      const s = shadow.spread;
      paintShadowOnly(paint, shadow, (offsetX) =>
        roundedRectPath(
          ctx,
          x - s + offsetX,
          y - s,
          w + s * 2,
          h + s * 2,
          radii.map((r) => (r > 0 ? r + s : 0)) as Radii,
        ),
      );
    }

    if (!isTransparent(style.backgroundColor)) {
      ctx.fillStyle = style.backgroundColor;
      ctx.beginPath();
      roundedRectPath(ctx, x, y, w, h, radii);
      ctx.fill();
    }

    if (style.backgroundImage && style.backgroundImage !== "none") {
      const gradient = createLinearGradient(
        ctx,
        style.backgroundImage,
        padX,
        padY,
        padW,
        padH,
      );
      if (gradient) {
        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundedRectPath(ctx, x, y, w, h, radii);
        ctx.fill();
      }
    }

    const insetShadows = shadows.filter((s) => s.inset);
    if (insetShadows.length > 0 && padW > 0 && padH > 0) {
      ctx.save();
      ctx.beginPath();
      roundedRectPath(ctx, padX, padY, padW, padH, padRadii);
      ctx.clip();
      for (const shadow of insetShadows) {
        const s = shadow.spread;
        // A large frame with a hole the shape of the (spread-shrunk) padding
        // box; its shadow is what shows through the hole.
        const margin = shadow.blur + Math.abs(s) + 64;
        paintShadowOnly(
          paint,
          shadow,
          (offsetX) => {
            ctx.rect(
              padX - margin + offsetX,
              padY - margin,
              padW + margin * 2,
              padH + margin * 2,
            );
            roundedRectPath(
              ctx,
              padX + s + offsetX,
              padY + s,
              padW - s * 2,
              padH - s * 2,
              shrinkRadii(padRadii, s),
            );
          },
          "evenodd",
        );
      }
      ctx.restore();
    }

    paintBorder(ctx, style, x, y, w, h, radii);

    if (el instanceof HTMLImageElement) {
      paintImage(paint, el, style, x, y, w, h);
    }

    const clips = [style.overflowX, style.overflowY].some(
      (v) => v !== "visible",
    );
    if (clips && padW > 0 && padH > 0) {
      ctx.beginPath();
      roundedRectPath(ctx, padX, padY, padW, padH, padRadii);
      ctx.clip();
    }
  }

  for (const child of el.childNodes) {
    if (child instanceof Text) paintText(paint, child, style);
    else if (child instanceof Element) paintElement(paint, child);
  }

  ctx.restore();
};

const loadCorsImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

/**
 * Returns something safe to draw for an <img>. The element itself is used
 * when it's loaded and won't taint the canvas; otherwise (still lazy-loading
 * off-screen, or fetched without CORS) a fresh CORS copy is loaded, which
 * normally comes straight from the HTTP cache.
 */
const resolveDrawable = async (
  img: HTMLImageElement,
): Promise<HTMLImageElement | null> => {
  const src = img.currentSrc || img.src;
  if (!src) return null;

  let sameOrigin = false;
  try {
    sameOrigin =
      src.startsWith("data:") ||
      new URL(src, window.location.href).origin === window.location.origin;
  } catch {
    // Unparseable URL — fall through to a fresh load.
  }

  const loaded = img.complete && img.naturalWidth > 0;
  const drawable =
    loaded && (sameOrigin || img.crossOrigin !== null)
      ? img
      : await loadCorsImage(src);
  if (!drawable) return null;

  // Decode off the main thread now. Otherwise the first drawImage of each
  // image decodes it synchronously, and with dozens of large character
  // renders that freezes the page mid-export.
  try {
    await drawable.decode();
  } catch {
    // Already decoded, or decode() rejected for an image that still draws.
  }
  return drawable;
};

/**
 * Renders `root` to a canvas at `scale` output pixels per CSS pixel.
 *
 * The canvas spans the root's full width and, vertically, only its direct
 * children that aren't ignored — so an ignored first or last child (e.g. an
 * empty-title placeholder) doesn't leave a blank band in the output.
 */
export const renderElementToCanvas = async (
  root: HTMLElement,
  { scale, ignore = () => false }: RenderOptions,
): Promise<HTMLCanvasElement> => {
  const imageElements = Array.from(root.querySelectorAll("img")).filter(
    (img) => {
      for (let el: Element | null = img; el && el !== root;) {
        if (ignore(el)) return false;
        el = el.parentElement;
      }
      return true;
    },
  );
  const drawables = await Promise.all(imageElements.map(resolveDrawable));
  const images = new Map(imageElements.map((img, i) => [img, drawables[i]]));

  // Measure after the awaits so the geometry matches what gets painted.
  const rootRect = root.getBoundingClientRect();
  const visibleChildren = Array.from(root.children).filter(
    (child) => !ignore(child),
  );
  let top = rootRect.top;
  let bottom = rootRect.bottom;
  if (visibleChildren.length > 0) {
    const rects = visibleChildren.map((c) => c.getBoundingClientRect());
    top = Math.min(...rects.map((r) => r.top));
    bottom = Math.max(...rects.map((r) => r.bottom));
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rootRect.width * scale));
  canvas.height = Math.max(1, Math.round((bottom - top) * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  ctx.scale(scale, scale);

  paintElement(
    { ctx, originX: rootRect.left, originY: top, scale, ignore, images },
    root,
  );

  return canvas;
};
