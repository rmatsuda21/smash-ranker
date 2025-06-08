import { PlayerInfo } from "@/types/top8/Result";

export const getCharImgUrl = ({
  characterId,
  alt = 0,
  type = "main",
}: {
  characterId: string | number;
  alt?: PlayerInfo["alt"];
  type?: "main" | "stock";
}) =>
  `https://raw.githubusercontent.com/rmatsuda21/SmashRankerAssets/main/${type}/${characterId}/${alt}.png`;
