import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Group } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";

import { Design } from "@/types/top8/Design";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";

import styles from "./TemplatePreview.module.scss";

type Props = {
  design: Design;
  onClick: () => void;
  className?: string;
};

const DEFAULT_PLAYER: PlayerInfo = {
  id: "0",
  entrantId: "0",
  name: "Player Name",
  characters: [{ id: "1293", alt: 0 }],
  placement: 0,
  gamerTag: "Player Name",
  prefix: "",
};

const placements = [1, 2, 3, 4, 5, 5, 7, 7];
const samplePlayers: PlayerInfo[] = new Array(20)
  .fill(DEFAULT_PLAYER)
  .map((player, index) => ({
    ...player,
    name: `Player ${index + 1}`,
    gamerTag: `Player ${index + 1}`,
    id: index.toString(),
    entrantId: index.toString(),
    placement: placements[index],
    twitter: undefined,
  }));
samplePlayers[0].name = "Reo M";
samplePlayers[0].gamerTag = "Reo M";
samplePlayers[0].entrantId = "69";
samplePlayers[0].id = "420";
samplePlayers[0].twitter = "chikyunojin";

const sampleTournament: TournamentInfo = {
  tournamentName: "Some Tournament",
  eventName: "Some Event",
  date: new Date(1999, 10, 7).toISOString(),
  location: {
    city: "College Station",
    state: "TX",
    country: "US",
  },
  entrants: 69,
  url: "https://start.gg/420-69-tournament",
};

export const TemplatePreview = ({ design, onClick, className }: Props) => {
  const stageRef = useRef<KonvaStage>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const [isTournamentReady, setIsTournamentReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const backgroundElements = useMemo(
    () =>
      createKonvaElements(
        design.background.elements,
        {
          containerSize: design.canvasSize,
          design: {
            colorPalette: design.colorPalette,
            bgAssetId: design.bgAssetId,
          },
          perfectDraw: false,
          options: {
            disableSelectable: true,
          },
        },
        { onAllReady: () => setIsBackgroundReady(true) }
      ),
    [
      design.background.elements,
      design.colorPalette,
      design.bgAssetId,
      design.canvasSize,
    ]
  );

  const tournamentElements = useMemo(
    () =>
      createKonvaElements(
        design.tournament?.elements ?? [],
        {
          tournament: sampleTournament,
          containerSize: design.canvasSize,
          design: {
            colorPalette: design.colorPalette,
            textPalette: design.textPalette,
            bgAssetId: design.bgAssetId,
          },
          perfectDraw: false,
          options: { disableSelectable: true },
        },
        { onAllReady: () => setIsTournamentReady(true) }
      ),
    [
      design.tournament?.elements,
      design.colorPalette,
      design.textPalette,
      design.bgAssetId,
      design.canvasSize,
    ]
  );

  const playerElements = useMemo(() => {
    const actualPlayerCount = Math.min(
      samplePlayers.length,
      design.players.length
    );
    let readyCount = 0;

    return samplePlayers.map((player, index) => {
      if (index >= design.players.length) return null;

      const playerDesign = {
        ...design.basePlayer,
        ...design.players[index],
      };

      const elements = createKonvaElements(
        playerDesign.elements ?? [],
        {
          player,
          containerSize: {
            width: playerDesign.size?.width,
            height: playerDesign.size?.height,
          },
          design: {
            colorPalette: design.colorPalette,
            bgAssetId: design.bgAssetId,
          },
          perfectDraw: false,
          options: { disableSelectable: true },
        },
        {
          onAllReady: () => {
            readyCount++;
            if (readyCount === actualPlayerCount) {
              setIsPlayerReady(true);
            }
          },
        }
      );

      return (
        <Group
          key={player.id}
          x={playerDesign.position?.x}
          y={playerDesign.position?.y}
          width={playerDesign.size?.width}
          height={playerDesign.size?.height}
          scaleX={playerDesign.scale?.x}
          scaleY={playerDesign.scale?.y}
          rotation={playerDesign.rotation ?? 0}
        >
          {elements}
        </Group>
      );
    });
  }, [
    design.basePlayer,
    design.players,
    design.colorPalette,
    design.bgAssetId,
  ]);

  const captureImage = useCallback(() => {
    if (!stageRef.current) {
      setTimeout(() => {
        captureImage();
      }, 1500);
      return;
    }

    try {
      const dataUrl = stageRef.current.toDataURL({
        quality: 0.1,
        mimeType: "image/webp",
      });

      setImageDataUrl(dataUrl);
      setIsRendering(false);
    } catch (error) {
      console.error("Failed to capture canvas:", error);
      setIsRendering(false);
    }
  }, []);

  useEffect(() => {
    if (isBackgroundReady && isTournamentReady && isPlayerReady) {
      captureImage();
    }
  }, [isBackgroundReady, isTournamentReady, isPlayerReady, captureImage]);

  return (
    <div className={cn(styles.previewContainer, className)}>
      <div className={styles.hiddenStage}>
        <Stage
          ref={stageRef}
          width={design.canvasSize.width}
          height={design.canvasSize.height}
          listening={false}
        >
          <Layer listening={false}>{backgroundElements}</Layer>
          <Layer listening={false}>{playerElements}</Layer>
          <Layer listening={false}>{tournamentElements}</Layer>
        </Stage>
      </div>

      {isRendering ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : imageDataUrl ? (
        <img
          src={imageDataUrl}
          alt="Template preview"
          className={styles.previewImage}
          onClick={onClick}
        />
      ) : (
        <div className={styles.error}>Failed to load preview</div>
      )}
    </div>
  );
};
