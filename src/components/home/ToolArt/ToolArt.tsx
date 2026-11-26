import predict from "@assets/home/tools/predict.svg?raw";
import ranker from "@assets/home/tools/ranker.svg?raw";
import recap from "@assets/home/tools/recap.svg?raw";
import thumbnail from "@assets/home/tools/thumbnail.svg?raw";
import tier from "@assets/home/tools/tier.svg?raw";

import styles from "./ToolArt.module.scss";

// Small drawings of what each tool makes, shown on the home page's tool
// cards in place of a description. Each is its own plain SVG file in
// `src/assets/home/tools/`, inlined (not an <img>) so the stylesheet can
// recolour its `tool-*` classes for the theme and accent and animate its
// parts while the card around it is hovered or focused (the art must be a
// direct child of that card). Decorative: the card's title and caption carry
// the meaning for assistive tech.
const ART = { ranker, tier, recap, thumbnail, predict };

export type ToolArtKind = keyof typeof ART;

export const ToolArt = ({ kind }: { kind: ToolArtKind }) => (
  <span
    className={styles.art}
    aria-hidden="true"
    // Our own bundled files, not user content.
    dangerouslySetInnerHTML={{ __html: ART[kind] }}
  />
);
