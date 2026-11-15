import { useEffect, useMemo, useRef, useState } from "react";
import { Group } from "react-konva";
import { shallow } from "zustand/shallow";

import type { Design } from "@/types/top8/Design";
import type { PlayerInfo } from "@/types/top8/Player";
import type { TournamentInfo } from "@/types/top8/Tournament";
import { getEffectiveCanvasSize, getPlayerConfigs } from "@/utils/top8/scene";

import { BackgroundContent } from "./BackgroundContent";
import { PlayersContent } from "./PlayersContent";
import { TournamentContent } from "./TournamentContent";
import { useLatestCallback, type SceneDesign } from "./useSceneFactoryContext";

type Props = {
  design: Design;
  players: PlayerInfo[];
  tournament: TournamentInfo;
  fontFamily: string;
  /** Called once background, players and tournament have loaded their
   *  images. */
  onReady?: () => void;
};

/** Keeps the previous reference while the value is shallow-equal, so a
 *  rebuilt-but-identical palette doesn't rebuild every element. */
const useShallowStable = <T,>(value: T): T => {
  const ref = useRef(value);
  if (!shallow(ref.current, value)) ref.current = value;
  return ref.current;
};

/**
 * A whole design drawn into the current layer: background, then players,
 * then tournament. For stages with nothing to interact with (the mobile
 * canvas, template previews, the preview generator). The desktop editor
 * composes the same three content components across its own layers.
 */
export const StaticScene = ({
  design,
  players,
  tournament,
  fontFamily,
  onReady,
}: Props) => {
  const canvasSize = useShallowStable(design.canvasSize);
  const colorPalette = useShallowStable(design.colorPalette);
  const textPalette = useShallowStable(design.textPalette);
  const { bgAssetId, bgImageDarkness } = design;

  const sceneDesign = useMemo<SceneDesign>(
    () => ({ colorPalette, textPalette, bgAssetId, bgImageDarkness }),
    [colorPalette, textPalette, bgAssetId, bgImageDarkness],
  );

  const effectiveCanvasSize = useMemo(
    () =>
      getEffectiveCanvasSize(
        canvasSize,
        design.dynamicPlayerHeight,
        design.players.length,
        players,
      ),
    [canvasSize, design.dynamicPlayerHeight, design.players.length, players],
  );

  const playerConfigs = useMemo(
    () =>
      getPlayerConfigs(
        design.basePlayer,
        design.players,
        design.dynamicPlayerHeight,
        players,
      ),
    [design.basePlayer, design.players, design.dynamicPlayerHeight, players],
  );

  const [ready, setReady] = useState({
    background: false,
    players: false,
    tournament: false,
  });
  const notifyReady = useLatestCallback(onReady);
  const allReady = ready.background && ready.players && ready.tournament;
  useEffect(() => {
    if (allReady) notifyReady();
  }, [allReady, notifyReady]);

  const markReady = useMemo(() => {
    const mark = (part: keyof typeof ready) => () =>
      setReady((prev) => (prev[part] ? prev : { ...prev, [part]: true }));
    return {
      background: mark("background"),
      players: mark("players"),
      tournament: mark("tournament"),
    };
  }, []);

  return (
    <>
      <Group listening={false}>
        <BackgroundContent
          elements={design.background.elements}
          canvasSize={canvasSize}
          effectiveCanvasSize={effectiveCanvasSize}
          design={sceneDesign}
          fontFamily={fontFamily}
          onReady={markReady.background}
        />
      </Group>
      <Group listening={false}>
        <PlayersContent
          players={players}
          configs={playerConfigs}
          reverseZOrder={design.reversePlayerZOrder}
          canvasSize={effectiveCanvasSize}
          design={sceneDesign}
          fontFamily={fontFamily}
          onReady={markReady.players}
        />
      </Group>
      <Group
        width={canvasSize.width}
        height={canvasSize.height}
        listening={false}
      >
        <TournamentContent
          elements={design.tournament?.elements}
          canvasSize={canvasSize}
          design={sceneDesign}
          fontFamily={fontFamily}
          tournament={tournament}
          onReady={markReady.tournament}
        />
      </Group>
    </>
  );
};
