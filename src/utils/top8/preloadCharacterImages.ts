import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CharacerData } from "@/types/top8/Player";

export const preloadCharacterImages = () => {
  const imagePromises: Promise<void>[] = [];

  characters.forEach((character) => {
    for (let alt = 0; alt < character.alts; alt++) {
      const stockUrl = getCharImgUrl({
        characterId: character.id,
        alt: alt as CharacerData["alt"],
        type: "stock",
      });

      // const mainUrl = getCharImgUrl({
      //   characterId: character.id,
      //   alt: alt as CharacerData["alt"],
      //   type: "main",
      // });

      [stockUrl].forEach((url) => {
        const promise = new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        });
        imagePromises.push(promise);
      });
    }
  });

  return Promise.allSettled(imagePromises);
};
