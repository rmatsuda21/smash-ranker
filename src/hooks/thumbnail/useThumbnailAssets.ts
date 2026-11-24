import { useEffect, useState } from "react";

import {
  loadThumbnailAssets,
  peekThumbnailAssets,
} from "@/utils/thumbnail/assets";
import type {
  ThumbnailAssets,
  ThumbnailScene,
} from "@/utils/thumbnail/painter";

// The images a scene needs, loaded as the scene changes. What is already in
// memory is returned at once, so typing a name never blanks the art.
export const useThumbnailAssets = (
  scene: ThumbnailScene,
): { assets: ThumbnailAssets; loading: boolean } => {
  const [left, right] = scene.match.sides;
  // Everything that decides which files are needed.
  const key = [
    left.characterId,
    left.alt,
    right.characterId,
    right.alt,
    scene.logoSrc,
    scene.look.font,
  ].join("|");

  const [state, setState] = useState<{
    key: string;
    assets: ThumbnailAssets;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadThumbnailAssets(scene).then((assets) => {
      if (!cancelled) setState({ key, assets });
    });
    return () => {
      cancelled = true;
    };
    // `key` covers the parts of the scene that matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (state?.key === key) return { assets: state.assets, loading: false };
  return { assets: peekThumbnailAssets(scene), loading: true };
};
