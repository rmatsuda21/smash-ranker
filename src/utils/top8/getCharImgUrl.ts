import { CharacerData } from "@/types/top8/Player";
import { RenderStyleId } from "@/types/Game";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { RENDER_STYLES } from "@/consts/games";
import { getRenderSet, resolveRenderAlt } from "@/utils/top8/characterCatalog";

// VITE_ASSET_BASE points the app at a local clone of the asset repo, to check
// art before it is pushed.
const ASSET_BASE =
  import.meta.env.VITE_ASSET_BASE ||
  "https://raw.githubusercontent.com/rmatsuda21/SmashRankerAssets/main";

export const getCharImgUrl = ({
  characterId,
  alt = 0,
  type = "main",
  style,
}: {
  characterId: string | number;
  alt?: CharacerData["alt"] | number;
  type?: "main" | "stock";
  // Render style for `type: "main"`. A character with no art in the style
  // gets its standard render, and a costume the style lacks gets the
  // style's first one. Head icons ignore it.
  style?: RenderStyleId;
}) => {
  if (characterId === EMPTY_CHARACTER_ID) return "/favicon.svg";

  const id = String(characterId);
  if (type === "main" && getRenderSet(id, style)) {
    const folder = RENDER_STYLES[style!].assetFolder;
    return `${ASSET_BASE}/${folder}/${id}/${resolveRenderAlt(id, alt, style)}.webp`;
  }

  return `${ASSET_BASE}/${type}/${id}/${alt}.webp`;
};
