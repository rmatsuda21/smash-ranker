import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";

import type { ThumbnailTemplateId } from "@/types/thumbnail/Thumbnail";
import {
  drawArt,
  drawLogo,
  drawName,
  drawText,
  fillPoly,
  H,
  inkOn,
  NIGHT,
  PAPER,
  poly,
  W,
  withAlpha,
  type Painter,
  type Rect,
} from "@/utils/thumbnail/painter";

export type ThumbnailTemplate = {
  id: ThumbnailTemplateId;
  label: MessageDescriptor;
  // Where each player's art sits, for dragging it on the preview.
  artBoxes: [Rect, Rect];
  draw: (p: Painter) => void;
};

const QUIET = "rgba(255, 255, 255, 0.62)";

const drawVs = (p: Painter, x: number, y: number, size: number) =>
  drawText(p, "VS", {
    x,
    y,
    maxWidth: size * 2,
    size,
    fill: PAPER,
    stroke: NIGHT,
    strokeWidth: size * 0.13,
  });

// Two colours meeting on a slanted line, names in a band across the top and
// the event and round in a band across the bottom.
const split: ThumbnailTemplate = {
  id: "split",
  label: msg`Split`,
  artBoxes: [
    { x: 0, y: 104, w: 640, h: 528 },
    { x: 640, y: 104, w: 640, h: 528 },
  ],
  draw: (p) => {
    const { ctx, scene } = p;
    const { look, match } = scene;
    // The line runs from x=690 at the top to x=590 at the bottom.
    fillPoly(
      ctx,
      [
        [0, 0],
        [690, 0],
        [590, H],
        [0, H],
      ],
      look.left,
    );
    fillPoly(
      ctx,
      [
        [690, 0],
        [W, 0],
        [W, H],
        [590, H],
      ],
      look.right,
    );

    drawArt(p, 0, split.artBoxes[0], {
      clip: () =>
        poly(ctx, [
          [0, 104],
          [668, 104],
          [594, 632],
          [0, 632],
        ]),
      shadow: "rgba(0, 0, 0, 0.35)",
    });
    drawArt(p, 1, split.artBoxes[1], {
      clip: () =>
        poly(ctx, [
          [684, 104],
          [W, 104],
          [W, 632],
          [610, 632],
        ]),
      shadow: "rgba(0, 0, 0, 0.35)",
    });
    fillPoly(
      ctx,
      [
        [682, 0],
        [698, 0],
        [598, H],
        [582, H],
      ],
      NIGHT,
    );

    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, 0, W, 104);
    const name = {
      y: 54,
      maxWidth: 540,
      size: 62,
      fill: PAPER,
      sponsorFill: QUIET,
    };
    drawName(p, match.sides[0], { ...name, x: 320 });
    drawName(p, match.sides[1], { ...name, x: 960 });

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 632, W, 88);
    const hasLogo = !!p.assets.logo;
    const foot = {
      y: 678,
      maxWidth: hasLogo ? 500 : 560,
      size: 40,
      fill: NIGHT,
    };
    drawText(p, look.eventText, { ...foot, x: 40, align: "left" });
    drawText(p, match.round, { ...foot, x: W - 40, align: "right" });
    drawLogo(p, 640, 640, 112);

    drawVs(p, 640, 360, 150);
  },
};

// A steep diagonal, names on dark plates at the bottom corners.
const slash: ThumbnailTemplate = {
  id: "slash",
  label: msg`Slash`,
  artBoxes: [
    { x: 0, y: 30, w: 640, h: 630 },
    { x: 640, y: 30, w: 640, h: 630 },
  ],
  draw: (p) => {
    const { ctx, scene } = p;
    const { look, match } = scene;
    fillPoly(
      ctx,
      [
        [0, 0],
        [800, 0],
        [480, H],
        [0, H],
      ],
      look.left,
    );
    fillPoly(
      ctx,
      [
        [800, 0],
        [W, 0],
        [W, H],
        [480, H],
      ],
      look.right,
    );

    drawArt(p, 0, slash.artBoxes[0], {
      clip: () =>
        poly(ctx, [
          [0, 0],
          [794, 0],
          [474, H],
          [0, H],
        ]),
      shadow: "rgba(0, 0, 0, 0.35)",
    });
    drawArt(p, 1, slash.artBoxes[1], {
      clip: () =>
        poly(ctx, [
          [832, 0],
          [W, 0],
          [W, H],
          [512, H],
        ]),
      shadow: "rgba(0, 0, 0, 0.35)",
    });
    fillPoly(
      ctx,
      [
        [794, 0],
        [832, 0],
        [512, H],
        [474, H],
      ],
      PAPER,
    );

    fillPoly(
      ctx,
      [
        [0, 540],
        [604, 540],
        [552, 656],
        [0, 656],
      ],
      NIGHT,
    );
    fillPoly(
      ctx,
      [
        [728, 540],
        [W, 540],
        [W, 656],
        [676, 656],
      ],
      NIGHT,
    );
    const name = {
      y: 600,
      maxWidth: 500,
      size: 62,
      fill: PAPER,
      sponsorFill: QUIET,
    };
    drawName(p, match.sides[0], { ...name, x: 36, align: "left" });
    drawName(p, match.sides[1], { ...name, x: W - 36, align: "right" });

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 656, W, 64);
    const foot = { y: 690, maxWidth: 560, size: 32, fill: NIGHT };
    drawText(p, look.eventText, { ...foot, x: 36, align: "left" });
    drawText(p, match.round, { ...foot, x: W - 36, align: "right" });

    drawLogo(p, 96, 96, 108);
    drawVs(p, 652, 330, 136);
  },
};

// Full-height art with two dark bands laid slightly askew over it.
const banner: ThumbnailTemplate = {
  id: "banner",
  label: msg`Banner`,
  artBoxes: [
    { x: 0, y: 60, w: 640, h: 660 },
    { x: 640, y: 60, w: 640, h: 660 },
  ],
  draw: (p) => {
    const { ctx, scene } = p;
    const { look, match } = scene;
    ctx.fillStyle = look.left;
    ctx.fillRect(0, 0, 640, H);
    ctx.fillStyle = look.right;
    ctx.fillRect(640, 0, 640, H);
    drawArt(p, 0, banner.artBoxes[0], { shadow: "rgba(0, 0, 0, 0.35)" });
    drawArt(p, 1, banner.artBoxes[1], { shadow: "rgba(0, 0, 0, 0.35)" });

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((-2 * Math.PI) / 180);
    ctx.fillStyle = NIGHT;
    ctx.fillRect(-760, -420, 1520, 170);
    ctx.fillRect(-760, 250, 1520, 170);
    const name = {
      y: -304,
      maxWidth: 540,
      size: 60,
      fill: PAPER,
      sponsorFill: QUIET,
    };
    drawName(p, match.sides[0], { ...name, x: -320 });
    drawName(p, match.sides[1], { ...name, x: 320 });
    const hasLogo = !!p.assets.logo;
    const foot = {
      y: 304,
      maxWidth: hasLogo ? 480 : 540,
      size: 38,
      fill: PAPER,
    };
    drawText(p, look.eventText, { ...foot, x: -596, align: "left" });
    drawText(p, match.round, { ...foot, x: 596, align: "right" });
    drawLogo(p, 0, 292, 116);
    ctx.restore();

    drawVs(p, 640, 372, 168);
  },
};

// Dark ground, each side lit in its colour, names large at the bottom.
const night: ThumbnailTemplate = {
  id: "night",
  label: msg`Night`,
  artBoxes: [
    { x: 30, y: 96, w: 590, h: 624 },
    { x: 660, y: 96, w: 590, h: 624 },
  ],
  draw: (p) => {
    const { ctx, scene } = p;
    const { look, match } = scene;
    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, 0, W, H);
    const light = (x: number, colour: string) => {
      const gradient = ctx.createRadialGradient(x, 400, 40, x, 400, 560);
      gradient.addColorStop(0, withAlpha(colour, 0.7));
      gradient.addColorStop(1, withAlpha(colour, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    };
    light(300, look.left);
    light(980, look.right);

    // The boxes only place the art here. Clipping to them would cut the
    // glow off in a straight line, so the art is clipped to the whole
    // graphic instead.
    const whole = () => {
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
    };
    drawArt(p, 0, night.artBoxes[0], {
      clip: whole,
      glow: withAlpha(look.left, 0.9),
    });
    drawArt(p, 1, night.artBoxes[1], {
      clip: whole,
      glow: withAlpha(look.right, 0.9),
    });

    const fade = ctx.createLinearGradient(0, 470, 0, H);
    fade.addColorStop(0, withAlpha(NIGHT, 0));
    fade.addColorStop(0.75, withAlpha(NIGHT, 0.92));
    ctx.fillStyle = fade;
    ctx.fillRect(0, 470, W, 250);

    const name = {
      y: 628,
      maxWidth: 540,
      size: 66,
      fill: PAPER,
      sponsorFill: QUIET,
    };
    drawName(p, match.sides[0], { ...name, x: 56, align: "left" });
    drawName(p, match.sides[1], { ...name, x: W - 56, align: "right" });
    ctx.fillStyle = look.left;
    ctx.fillRect(56, 674, 200, 10);
    ctx.fillStyle = look.right;
    ctx.fillRect(W - 256, 674, 200, 10);

    const hasLogo = !!p.assets.logo;
    drawLogo(p, 640, 70, 84);
    const top = hasLogo ? 148 : 56;
    drawText(p, match.round, {
      x: 640,
      y: top,
      maxWidth: 520,
      size: 40,
      fill: PAPER,
    });
    drawText(p, look.eventText, {
      x: 640,
      y: top + 44,
      maxWidth: 520,
      size: 24,
      fill: QUIET,
    });

    drawText(p, "VS", {
      x: 640,
      y: 400,
      maxWidth: 260,
      size: 120,
      fill: PAPER,
      stroke: PAPER,
      strokeWidth: 5,
      hollow: true,
    });
  },
};

// Light ground with the two players on coloured cards.
const card: ThumbnailTemplate = {
  id: "card",
  label: msg`Card`,
  artBoxes: [
    { x: 56, y: 124, w: 540, h: 440 },
    { x: 684, y: 124, w: 540, h: 440 },
  ],
  draw: (p) => {
    const { ctx, scene } = p;
    const { look, match } = scene;
    const ground = "#f3f0e8";
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, W, H);

    const panel = (index: 0 | 1, colour: string) => {
      const box = card.artBoxes[index];
      const path = () => {
        ctx.beginPath();
        ctx.roundRect(box.x, box.y, box.w, box.h, 28);
      };
      path();
      ctx.fillStyle = colour;
      ctx.fill();
      drawArt(p, index, box, { clip: path, shadow: "rgba(0, 0, 0, 0.3)" });
    };
    panel(0, look.left);
    panel(1, look.right);

    const name = {
      y: 632,
      maxWidth: 540,
      size: 58,
      fill: NIGHT,
      sponsorFill: "rgba(11, 11, 16, 0.62)",
    };
    drawName(p, match.sides[0], { ...name, x: 326 });
    drawName(p, match.sides[1], { ...name, x: 954 });

    const hasLogo = !!p.assets.logo;
    const head = {
      y: 64,
      maxWidth: hasLogo ? 500 : 560,
      size: 36,
      fill: NIGHT,
    };
    drawText(p, look.eventText, { ...head, x: 56, align: "left" });
    drawText(p, match.round, { ...head, x: W - 56, align: "right" });
    drawLogo(p, 640, 62, 96);

    ctx.beginPath();
    ctx.arc(640, 344, 70, 0, Math.PI * 2);
    ctx.fillStyle = NIGHT;
    ctx.fill();
    drawText(p, "VS", {
      x: 640,
      y: 348,
      maxWidth: 110,
      size: 62,
      fill: inkOn(NIGHT),
    });
  },
};

export const THUMBNAIL_TEMPLATES: ThumbnailTemplate[] = [
  split,
  slash,
  banner,
  night,
  card,
];

export const getThumbnailTemplate = (
  id: ThumbnailTemplateId,
): ThumbnailTemplate =>
  THUMBNAIL_TEMPLATES.find((template) => template.id === id) ?? split;
