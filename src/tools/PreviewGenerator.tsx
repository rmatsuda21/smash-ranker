import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Stage, Layer, Group } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";

import { createKonvaElements } from "@/utils/top8/elementFactory";
import { createSamplePlayers } from "@/utils/top8/samplePlayers";
import { TournamentInfo } from "@/types/top8/Tournament";
import { DBTemplate } from "@/types/Repository";

import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";
import {
  minimalDesign,
  minimal4Design,
  minimal16Design,
  minimal24Design,
} from "@/designs/minimal";
import { kagaribiDesign } from "@/designs/kagaribi";

declare global {
  interface Window {
    __previews?: { id: string; dataUrl: string }[];
    __previewsReady?: boolean;
    __previewError?: string;
  }
}

const TEMPLATES: DBTemplate[] = [
  { id: "top8er", name: "Top8er", design: top8erDesign, font: "Noto Sans JP" },
  {
    id: "top8er-squares",
    name: "Top8er (Square Variant)",
    design: squaresDesign,
    font: "Noto Sans JP",
  },
  {
    id: "minimal",
    name: "Minimal",
    design: minimalDesign,
    font: "Noto Sans JP",
  },
  {
    id: "minimal-4",
    name: "Minimal (4 Players)",
    design: minimal4Design,
    font: "Noto Sans JP",
  },
  {
    id: "minimal-16",
    name: "Minimal (16 Players)",
    design: minimal16Design,
    font: "Noto Sans JP",
  },
  {
    id: "minimal-24",
    name: "Minimal (24 Players)",
    design: minimal24Design,
    font: "Noto Sans JP",
  },
  {
    id: "kagaribi",
    name: "Kagaribi",
    design: kagaribiDesign,
    font: "Dela Gothic One",
  },
];

const samplePlayers = createSamplePlayers(24);

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

const TemplateRenderer = ({
  template,
  onCaptured,
}: {
  template: DBTemplate;
  onCaptured: (id: string, dataUrl: string) => void;
}) => {
  const stageRef = useRef<KonvaStage>(null);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const [isTournamentReady, setIsTournamentReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [captured, setCaptured] = useState(false);

  const backgroundElements = useMemo(
    () =>
      createKonvaElements(
        template.design.background.elements,
        {
          fontFamily: template.font,
          containerSize: template.design.canvasSize,
          design: {
            colorPalette: template.design.colorPalette,
            bgAssetId: template.design.bgAssetId,
            bgImageDarkness: template.design.bgImageDarkness,
          },
          perfectDraw: false,
          options: { disableSelectable: true },
        },
        { onAllReady: () => setIsBackgroundReady(true) }
      ),
    [template]
  );

  const tournamentElements = useMemo(
    () =>
      createKonvaElements(
        template.design.tournament?.elements ?? [],
        {
          fontFamily: template.font,
          tournament: sampleTournament,
          containerSize: template.design.canvasSize,
          design: {
            colorPalette: template.design.colorPalette,
            textPalette: template.design.textPalette,
            bgAssetId: template.design.bgAssetId,
            bgImageDarkness: template.design.bgImageDarkness,
          },
          perfectDraw: false,
          options: { disableSelectable: true },
        },
        { onAllReady: () => setIsTournamentReady(true) }
      ),
    [template]
  );

  const playerElements = useMemo(() => {
    const actualPlayerCount = Math.min(
      samplePlayers.length,
      template.design.players.length
    );
    let readyCount = 0;

    const indices = samplePlayers.map((_, i) => i);
    const renderOrder = template.design.reversePlayerZOrder
      ? [...indices].reverse()
      : indices;

    return renderOrder.map((index) => {
      const player = samplePlayers[index];
      if (!player || index >= template.design.players.length) return null;

      const playerDesign = {
        ...template.design.basePlayer,
        ...template.design.players[index],
      };

      const elements = createKonvaElements(
        playerDesign.elements ?? [],
        {
          fontFamily: template.font,
          player,
          containerSize: {
            width: playerDesign.size?.width,
            height: playerDesign.size?.height,
          },
          design: {
            colorPalette: template.design.colorPalette,
            bgAssetId: template.design.bgAssetId,
            bgImageDarkness: template.design.bgImageDarkness,
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
  }, [template]);

  const captureImage = useCallback(() => {
    if (!stageRef.current) {
      setTimeout(captureImage, 500);
      return;
    }

    try {
      const dataUrl = stageRef.current.toDataURL({
        mimeType: "image/webp",
        quality: 0.5,
      });
      onCaptured(template.id, dataUrl);
      setCaptured(true);
    } catch (error) {
      console.error(`Failed to capture ${template.id}:`, error);
      setTimeout(captureImage, 500);
    }
  }, [template.id, onCaptured]);

  useEffect(() => {
    if (isBackgroundReady && isTournamentReady && isPlayerReady && !captured) {
      // Small delay to ensure canvas has fully painted
      setTimeout(captureImage, 200);
    }
  }, [isBackgroundReady, isTournamentReady, isPlayerReady, captured, captureImage]);

  return (
    <div style={{ position: "absolute", left: -9999, top: -9999 }}>
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
  );
};

const PreviewGeneratorApp = () => {
  const capturedRef = useRef<Map<string, string>>(new Map());
  const [done, setDone] = useState(false);

  const handleCaptured = useCallback((id: string, dataUrl: string) => {
    capturedRef.current.set(id, dataUrl);
    console.log(
      `Captured ${id} (${capturedRef.current.size}/${TEMPLATES.length})`
    );

    if (capturedRef.current.size === TEMPLATES.length) {
      const previews = TEMPLATES.map((t) => ({
        id: t.id,
        dataUrl: capturedRef.current.get(t.id)!,
      }));
      window.__previews = previews;
      window.__previewsReady = true;
      setDone(true);
      console.log("All previews ready!");
    }
  }, []);

  return (
    <div>
      <h1>Preview Generator</h1>
      <p>
        {done
          ? `Done! Captured ${TEMPLATES.length} previews.`
          : "Rendering templates..."}
      </p>
      {TEMPLATES.map((template) => (
        <TemplateRenderer
          key={template.id}
          template={template}
          onCaptured={handleCaptured}
        />
      ))}
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<PreviewGeneratorApp />);
