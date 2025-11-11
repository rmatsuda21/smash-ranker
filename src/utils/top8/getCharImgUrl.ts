import { CharacerData } from "@/types/top8/Player";

export const getCharImgUrl = ({
  characterId,
  alt = 0,
  type = "main",
}: {
  characterId: string | number;
  alt?: CharacerData["alt"];
  type?: "main" | "stock";
}) =>
  `https://raw.githubusercontent.com/rmatsuda21/SmashRankerAssets/main/${type}/${characterId}/${alt}.png`;
