import { CharacerData } from "@/types/top8/Player";
import { RenderStyleId } from "@/types/Game";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { RENDER_STYLES } from "@/consts/games";
import { getRenderSet, resolveRenderAlt } from "@/utils/top8/characterCatalog";

// The asset repo as Cloudflare serves it: every push to its `main` is
// deployed as static files, with CORS and a one-day cache (the repo's
// `_headers`). Straight from GitHub the files are kept five minutes and an
// address that asks for many is throttled; jsDelivr's mirror answers 403 for
// some files because the repo is over its 50 MB limit.
// `api/results-image.ts` has the same address.
export const DEFAULT_ASSET_BASE =
  "https://smashrankerassets.reo-matsuda-bfa.workers.dev";

// VITE_ASSET_BASE points the app at another copy, such as a local clone of
// the asset repo to check art before it is pushed.
const ASSET_BASE =
  import.meta.env.VITE_ASSET_BASE?.replace(/\/+$/, "") || DEFAULT_ASSET_BASE;

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
