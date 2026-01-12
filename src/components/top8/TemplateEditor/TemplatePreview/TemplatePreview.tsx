import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Group } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";

import { DBTemplate } from "@/types/Repository";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { createSamplePlayers } from "@/utils/top8/samplePlayers";
import { TournamentInfo } from "@/types/top8/Tournament";
import { useTooltip } from "@/hooks/top8/useTooltip";
import { Spinner } from "@/components/shared/Spinner/Spinner";

import styles from "./TemplatePreview.module.scss";

type Props = {
  template: DBTemplate;
  onClick: () => void;
  className?: string;
};

const samplePlayers = createSamplePlayers(20);

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

export const TemplatePreview = ({ template, onClick, className }: Props) => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const [isTournamentReady, setIsTournamentReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const stageRef = useRef<KonvaStage>(null);

  const { Tooltip, handleMouseEnter, handleMouseLeave } = useTooltip({
    tooltip: template.name,
  });

  const backgroundElements = useMemo(
    () =>
      createKonvaElements(
        template.design.background.elements,
        {
          containerSize: template.design.canvasSize,
          design: {
            colorPalette: template.design.colorPalette,
            bgAssetId: template.design.bgAssetId,
          },
          perfectDraw: false,
          options: {
            disableSelectable: true,
          },
        },
        { onAllReady: () => setIsBackgroundReady(true) }
      ),
    [
      template.design.background.elements,
      template.design.colorPalette,
      template.design.bgAssetId,
      template.design.canvasSize,
    ]
  );

  const tournamentElements = useMemo(
    () =>
      createKonvaElements(
        template.design.tournament?.elements ?? [],
        {
          tournament: sampleTournament,
          containerSize: template.design.canvasSize,
          design: {
            colorPalette: template.design.colorPalette,
            textPalette: template.design.textPalette,
            bgAssetId: template.design.bgAssetId,
          },
          perfectDraw: false,
          options: { disableSelectable: true },
        },
        { onAllReady: () => setIsTournamentReady(true) }
      ),
    [
      template.design.tournament?.elements,
      template.design.colorPalette,
      template.design.textPalette,
      template.design.bgAssetId,
      template.design.canvasSize,
    ]
  );

  const playerElements = useMemo(() => {
    const actualPlayerCount = Math.min(
      samplePlayers.length,
      template.design.players.length
    );
    let readyCount = 0;

    return samplePlayers.map((player, index) => {
      if (index >= template.design.players.length) return null;

      const playerDesign = {
        ...template.design.basePlayer,
        ...template.design.players[index],
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
            colorPalette: template.design.colorPalette,
            bgAssetId: template.design.bgAssetId,
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
    template.design.basePlayer,
    template.design.players,
    template.design.colorPalette,
    template.design.bgAssetId,
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
    <div
      className={cn(styles.previewContainer, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.hiddenStage}>
        <Stage
          ref={stageRef}
          width={template.design.canvasSize.width}
          height={template.design.canvasSize.height}
          listening={false}
        >
          <Layer listening={false}>{backgroundElements}</Layer>
          <Layer listening={false}>{playerElements}</Layer>
          <Layer listening={false}>{tournamentElements}</Layer>
        </Stage>
      </div>

      {isRendering && (
        <div className={styles.loading}>
          <Spinner size={32} />
        </div>
      )}

      {imageDataUrl && (
        <img
          src={imageDataUrl}
          alt="Template preview"
          className={styles.previewImage}
          onClick={onClick}
        />
      )}

      {!imageDataUrl && !isRendering && (
        <div className={styles.error}>Failed to load preview</div>
      )}

      {Tooltip && <Tooltip className={styles.tooltip} />}
    </div>
  );
};
