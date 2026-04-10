import { CharacerData } from "@/types/top8/Player";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";

export const getCharImgUrl = ({
  characterId,
  alt = 0,
  type = "main",
}: {
  characterId: string | number;
  alt?: CharacerData["alt"];
  type?: "main" | "stock";
}) => {
  if (characterId === EMPTY_CHARACTER_ID) return "/favicon.svg";

  return `https://raw.githubusercontent.com/rmatsuda21/SmashRankerAssets/main/${type}/${characterId}/${alt}.${
    type === "main" ? "webp" : "png"
  }`;
};
