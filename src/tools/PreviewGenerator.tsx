/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Stage, Layer } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";

import { RenderProfileContext } from "@/components/top8/Canvas/RenderProfileContext";
import { StaticScene } from "@/components/top8/Canvas/scene/StaticScene";
import { OFFSCREEN_PROFILE } from "@/utils/top8/renderProfile";
import { getEffectiveCanvasSize, getUnusedIconSpace } from "@/utils/top8/scene";
import { createSamplePlayers } from "@/utils/top8/samplePlayers";
import { loadFamily } from "@/utils/fonts/fontLoader";
import { TournamentInfo } from "@/types/top8/Tournament";
import { DBTemplate } from "@/types/Repository";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";

import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";
import { minimalDarkDesign, minimalLightDesign } from "@/designs/minimal";
import { kagaribiDesign } from "@/designs/kagaribi";
import { kagaribi16Design } from "@/designs/kagaribi16";
import { standingsLightDesign, standingsDarkDesign } from "@/designs/standings";
import { resizePlayerSlots } from "@/utils/top8/playerCount";

declare global {
  interface Window {
    __previews?: { id: string; dataUrl: string }[];
    __previewsReady?: boolean;
    __previewError?: string;
  }
}

type PreviewTemplate = DBTemplate & { players?: PlayerInfo[] };

const BUILT_IN_TEMPLATES: PreviewTemplate[] = [
  {
    id: "top8er",
    name: "Original",
    design: top8erDesign,
    font: "Noto Sans JP",
  },
  {
    id: "top8er-squares",
    name: "Square Variant",
    design: squaresDesign,
    font: "Noto Sans JP",
  },
  {
    id: "minimal-dark",
    name: "Dark",
    design: minimalDarkDesign,
    font: "Noto Sans JP",
  },
  {
    id: "minimal-light",
    name: "Light",
    design: minimalLightDesign,
    font: "Noto Sans JP",
  },
  {
    id: "kagaribi",
    name: "Original",
    design: kagaribiDesign,
    font: "Dela Gothic One",
  },
  {
    id: "kagaribi-16",
    name: "16 Player Variant",
    design: kagaribi16Design,
    font: "Dela Gothic One",
  },
  {
    id: "standings-dark",
    name: "Dark",
    design: standingsDarkDesign,
    font: "Noto Sans JP",
  },
  {
    id: "standings-light",
    name: "Light",
    design: standingsLightDesign,
    font: "Noto Sans JP",
  },
];

const samplePlayers = createSamplePlayers(24);

// Players with enough characters to wrap onto extra rows, which is what
// makes dynamic player height grow cards and the canvas.
const multiCharacterPlayers = samplePlayers.map((player, index) => {
  const characterCount = [9, 1, 14, 2, 7, 1, 1, 3][index] ?? 1;
  return {
    ...player,
    characters: Array.from({ length: characterCount }, (_, alt) => ({
      id: "1293",
      alt: (alt % 8) as CharacerData["alt"],
    })),
  };
});

// Golden-only cases: variations of built-in templates that exercise code the
// plain templates don't. They never become picker thumbnails.
const GOLDEN_ONLY_TEMPLATES: PreviewTemplate[] = [
  {
    id: "minimal-dark-dynamic-height",
    name: "8 Players (Dark), multi-character",
    design: minimalDarkDesign,
    font: "Noto Sans JP",
    players: multiCharacterPlayers,
  },
  // Player count changed in the Players tab (`dynamicPlayerCount`).
  {
    id: "minimal-4-dark",
    name: "Minimal dark, 4 players",
    design: resizePlayerSlots(minimalDarkDesign, 4),
    font: "Noto Sans JP",
  },
  {
    id: "minimal-4-light",
    name: "Minimal light, 4 players",
    design: resizePlayerSlots(minimalLightDesign, 4),
    font: "Noto Sans JP",
  },
  {
    id: "standings-16-light",
    name: "Standings, 16 players",
    design: resizePlayerSlots(standingsLightDesign, 16),
    font: "Noto Sans JP",
  },
  // Characters that continue the name's line and wrap under the flag.
  {
    id: "standings-light-wrapped",
    name: "Standings, multi-character",
    design: standingsLightDesign,
    font: "Noto Sans JP",
    players: multiCharacterPlayers,
  },
  // Alternate-character grids: row flow (top8er) and column flow (kagaribi).
  {
    id: "top8er-alt-characters",
    name: "Original, multi-character",
    design: top8erDesign,
    font: "Noto Sans JP",
    players: multiCharacterPlayers,
  },
  {
    id: "kagaribi-alt-characters",
    name: "Kagaribi, multi-character",
    design: kagaribiDesign,
    font: "Dela Gothic One",
    players: multiCharacterPlayers,
  },
];

// `?mode=golden` captures lossless half-resolution PNGs for the regression
// check (scripts/check-goldens.ts) instead of lossy WebP thumbnails.
const GOLDEN_MODE =
  new URLSearchParams(window.location.search).get("mode") === "golden";
const TEMPLATES = GOLDEN_MODE
  ? [...BUILT_IN_TEMPLATES, ...GOLDEN_ONLY_TEMPLATES]
  : BUILT_IN_TEMPLATES;
const CAPTURE_OPTIONS = GOLDEN_MODE
  ? { mimeType: "image/png", pixelRatio: 0.5 }
  : { mimeType: "image/webp", quality: 0.5 };

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
  template: PreviewTemplate;
  onCaptured: (id: string, dataUrl: string) => void;
}) => {
  const stageRef = useRef<KonvaStage>(null);
  const players = template.players ?? samplePlayers;
  const stageSize = getEffectiveCanvasSize(
    template.design,
    players,
    template.font,
    getUnusedIconSpace(
      template.design.tournamentIconSpace,
      sampleTournament.iconSrc,
    ),
  );
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [captured, setCaptured] = useState(false);
  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);

  const captureImage = useCallback(() => {
    if (!stageRef.current) {
      setTimeout(captureImage, 500);
      return;
    }

    try {
      const dataUrl = stageRef.current.toDataURL(CAPTURE_OPTIONS);
      onCaptured(template.id, dataUrl);
      setCaptured(true);
    } catch (error) {
      console.error(`Failed to capture ${template.id}:`, error);
      setTimeout(captureImage, 500);
    }
  }, [template.id, onCaptured]);

  useEffect(() => {
    if (isSceneReady && !captured) {
      // Small delay to ensure canvas has fully painted
      setTimeout(captureImage, 200);
    }
  }, [isSceneReady, captured, captureImage]);

  return (
    <div style={{ position: "absolute", left: -9999, top: -9999 }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        listening={false}
      >
        <RenderProfileContext value={OFFSCREEN_PROFILE}>
          <Layer listening={false}>
            <StaticScene
              design={template.design}
              players={players}
              tournament={sampleTournament}
              fontFamily={template.font}
              onReady={handleSceneReady}
            />
          </Layer>
        </RenderProfileContext>
      </Stage>
    </div>
  );
};

const PreviewGeneratorApp = () => {
  const capturedRef = useRef<Map<string, string>>(new Map());
  const [done, setDone] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    const uniqueFonts = [...new Set(TEMPLATES.map((t) => t.font))];
    console.log(`Loading fonts: ${uniqueFonts.join(", ")}...`);

    Promise.all(
      uniqueFonts.map(async (family) => {
        await loadFamily(family);
        console.log(`Loaded font: ${family}`);
      }),
    )
      .then(() => setFontsReady(true))
      .catch((error) => {
        console.error("Font loading failed:", error);
        window.__previewError = `Font loading failed: ${error}`;
      });
  }, []);

  const handleCaptured = useCallback((id: string, dataUrl: string) => {
    capturedRef.current.set(id, dataUrl);
    console.log(
      `Captured ${id} (${capturedRef.current.size}/${TEMPLATES.length})`,
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
          : fontsReady
            ? "Rendering templates..."
            : "Loading fonts..."}
      </p>
      {fontsReady &&
        TEMPLATES.map((template) => (
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
