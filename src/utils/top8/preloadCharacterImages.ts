import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CharacerData } from "@/types/top8/Player";

const CACHE_NAME = "character-stocks-v1";
const BATCH_SIZE = 10;

const preloadBatch = async (urls: string[]): Promise<void> => {
  if ("caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const uncachedUrls: string[] = [];

      await Promise.all(
        urls.map(async (url) => {
          const cached = await cache.match(url);
          if (!cached) uncachedUrls.push(url);
        })
      );

      if (uncachedUrls.length > 0) {
        await cache.addAll(uncachedUrls);
      }
      return;
    } catch {
      console.error("Error caching character stock images");
    }
  }

  await Promise.all(
    urls.map((url) =>
      fetch(url, { priority: "low" } as RequestInit).catch(() => {})
    )
  );
};

const scheduleIdleWork = (
  callback: () => void,
  timeout = 2000
): Promise<void> => {
  return new Promise((resolve) => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(
        () => {
          callback();
          resolve();
        },
        { timeout }
      );
    } else {
      // Fallback for Safari
      setTimeout(() => {
        callback();
        resolve();
      }, 100);
    }
  });
};

export const preloadCharacterImages = async (): Promise<void> => {
  const urls = characters.map((character) =>
    getCharImgUrl({
      characterId: character.id,
      alt: 0 as CharacerData["alt"],
      type: "stock",
    })
  );

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);

    await scheduleIdleWork(async () => {
      await preloadBatch(batch);
    });
  }

  console.log(`[Preload] Cached ${urls.length} character stock images`);
};
