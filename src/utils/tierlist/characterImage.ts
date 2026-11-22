import { ImageDisplayMode } from "@/types/tierlist/TierList";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

// The image a tier list character shows in an image mode. "mural" is the
// mural render where the character has one (its standard render otherwise).
export const getTierCharacterImageUrl = (
  characterId: string,
  alt: number,
  imageMode: ImageDisplayMode,
): string =>
  getCharImgUrl({
    characterId,
    alt,
    type: imageMode === "stock" ? "stock" : "main",
    style: imageMode === "mural" ? "mural" : undefined,
  });
