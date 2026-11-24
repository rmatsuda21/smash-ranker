/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Stage, Layer } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";

import { RenderProfileContext } from "@/components/top8/Canvas/RenderProfileContext";
import { StaticScene } from "@/components/top8/Canvas/scene/StaticScene";
import { OFFSCREEN_PROFILE } from "@/utils/top8/renderProfile";
import { getEffectiveCanvasSize, getUnusedIconSpace } from "@/utils/top8/scene";
import {
  createSamplePlayers,
  createSampleTeams,
  SAMPLE_LINEUP_COUNT,
} from "@/utils/top8/samplePlayers";
import { loadFamily } from "@/utils/fonts/fontLoader";
import { TournamentInfo } from "@/types/top8/Tournament";
import { DBTemplate } from "@/types/Repository";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";

import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";
import { minimalDarkDesign, minimalLightDesign } from "@/designs/minimal";
import { kagaribiDesign } from "@/designs/kagaribi";
import { kagaribi16Design } from "@/designs/kagaribi16";
import { kagaribiDoublesDesign } from "@/designs/kagaribiDoubles";
import { standingsLightDesign, standingsDarkDesign } from "@/designs/standings";
import { comicBookDesign } from "@/designs/comicBook";
import { neonSignDesign } from "@/designs/neonSign";
import { highScoreDesign } from "@/designs/highScore";
import {
  colourBarsDesign,
  colourBarsMonoDesign,
  colourBarsPastelDesign,
  colourBarsSignalDesign,
} from "@/designs/colourBars";
import { sleeveDesign } from "@/designs/sleeve";
import {
  tapeDesign,
  tapeMintDesign,
  tapeNightDesign,
  tapePinkDesign,
  tapeSkyDesign,
} from "@/designs/tape";
import { resizePlayerSlots } from "@/utils/top8/playerCount";
import { applyRenderStyle } from "@/utils/top8/renderStyle";
import { RenderStyleId } from "@/types/Game";
import {
  SAMPLE_DOUBLES_TOURNAMENT,
  SAMPLE_TOURNAMENT,
} from "@/utils/top8/sampleTournament";
import { tagTeamDesign } from "@/designs/tagTeam";
import { duetDesign } from "@/designs/duet";

declare global {
  interface Window {
    __previews?: { id: string; dataUrl: string }[];
    __previewsReady?: boolean;
    __previewError?: string;
  }
}

type PreviewTemplate = DBTemplate & {
  players?: PlayerInfo[];
  tournament?: TournamentInfo;
  // Draws the characters in this render style where they have art in it.
  renderStyle?: RenderStyleId;
};

// Doubles templates are shown with teams: every sample player has a
// teammate.
const sampleTeams = createSampleTeams(16);
const doubles = {
  players: sampleTeams,
  tournament: SAMPLE_DOUBLES_TOURNAMENT,
};

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
    id: "kagaribi-doubles",
    name: "Doubles",
    design: kagaribiDoublesDesign,
    font: "Dela Gothic One",
    ...doubles,
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
  {
    id: "comic-book",
    name: "Original",
    design: comicBookDesign,
    font: "Dela Gothic One",
    renderStyle: "mural",
  },
  {
    id: "neon-sign",
    name: "Original",
    design: neonSignDesign,
    font: "M PLUS Rounded 1c",
  },
  {
    id: "high-score",
    name: "Original",
    design: highScoreDesign,
    font: "DotGothic16",
  },
  {
    id: "tape",
    name: "Original",
    design: tapeDesign,
    font: "Dela Gothic One",
  },
  {
    id: "tape-mint",
    name: "Mint",
    design: tapeMintDesign,
    font: "Dela Gothic One",
    renderStyle: "mural",
  },
  {
    id: "tape-sky",
    name: "Sky",
    design: tapeSkyDesign,
    font: "Dela Gothic One",
  },
  {
    id: "tape-pink",
    name: "Pink",
    design: tapePinkDesign,
    font: "Dela Gothic One",
  },
  {
    id: "tape-night",
    name: "Night",
    design: tapeNightDesign,
    font: "Dela Gothic One",
    renderStyle: "mural",
  },
  {
    id: "colour-bars",
    name: "Original",
    design: colourBarsDesign,
    font: "Noto Sans JP",
  },
  {
    id: "colour-bars-signal",
    name: "Signal",
    design: colourBarsSignalDesign,
    font: "Noto Sans JP",
  },
  {
    id: "colour-bars-pastel",
    name: "Pastel",
    design: colourBarsPastelDesign,
    font: "Noto Sans JP",
  },
  {
    id: "colour-bars-mono",
    name: "Mono",
    design: colourBarsMonoDesign,
    font: "Noto Sans JP",
  },
  {
    id: "sleeve",
    name: "Original",
    design: sleeveDesign,
    font: "Noto Sans JP",
  },
  {
    id: "tag-team",
    name: "Doubles",
    design: tagTeamDesign,
    font: "RocknRoll One",
    ...doubles,
  },
  {
    id: "duet",
    name: "Doubles",
    design: duetDesign,
    font: "Shippori Mincho",
    ...doubles,
  },
];

const sampleTournament = SAMPLE_TOURNAMENT;

// A name that needs two lines, with an icon beside it.
const longNameTournament: TournamentInfo = {
  ...sampleTournament,
  tournamentName: "Yokohama Harbor Clash Championship Series 12: Winter Finals",
  eventName: "Ultimate Singles",
  iconSrc: "/og-default.png",
};

const sampleLineups = Array.from({ length: SAMPLE_LINEUP_COUNT }, (_, lineup) =>
  createSamplePlayers(24, lineup),
);
const samplePlayers = sampleLineups[0];

// Templates with no players of their own get one of the lineups, picked from
// the id so it stays the same when templates are added.
const lineupFor = (id: string) =>
  sampleLineups[
    Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      sampleLineups.length
  ];

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

// The sample players already have a different fighter in every slot, with
// prefixes and flags; the cases below start from them.
const CAST_IDS = [
  "1453",
  "1766",
  "1332",
  "1795",
  "1286",
  "1317",
  "1331",
  "1846",
];
const castPlayers = samplePlayers;

// A name too long for its column beside a player with many characters, for
// tables that have to share the width out.
const crowdedPlayers = castPlayers.map((player, index) => ({
  ...player,
  ...(index === 2 && {
    gamerTag: "The Longest Gamer Tag In The Whole Bracket By Far",
  }),
  ...(index === 5 && {
    characters: Array.from({ length: 11 }, (_, alt) => ({
      id: CAST_IDS[alt % CAST_IDS.length],
      alt: 0 as CharacerData["alt"],
    })),
  }),
}));

// Long tags and sponsors next to short ones, for name plates that shrink
// and cut.
const LONG_TAGS = [
  "Reo M",
  "Kumonosu Thunderstorm",
  "VantaBlackMagicWoman99",
  "Lumen",
  "Hollow the Unbreakable",
  "テンキーおじさん（本物）",
  "Brask",
  "xX_Ostrich_Runner_Xx",
];
const LONG_PREFIXES = [
  "Yokohama Bay Gaming",
  "KMO",
  "",
  "PXL",
  "Team Hollow Knights JP",
  "",
  "LYS",
  "SDJ",
];
const longNamePlayers = castPlayers.map((player, index) =>
  index < LONG_TAGS.length
    ? {
        ...player,
        gamerTag: LONG_TAGS[index],
        prefix: LONG_PREFIXES[index],
        // One player with no flag.
        ...(index === 2 && { country: "" }),
      }
    : player,
);

// Teams whose names have to shrink, with extra characters on both players
// and one team that has lost its second player.
const crowdedTeams = sampleTeams.map((team, index) => {
  if (index === 7) return { ...team, teammate: undefined };
  if (index >= LONG_TAGS.length - 1 || !team.teammate) return team;

  const extras = (count: number) =>
    Array.from({ length: count }, (_, alt) => ({
      id: CAST_IDS[(index + alt) % CAST_IDS.length],
      alt: 0 as CharacerData["alt"],
    }));

  return {
    ...team,
    gamerTag: LONG_TAGS[index + 1],
    prefix: LONG_PREFIXES[index + 1],
    characters: [...team.characters, ...extras(index % 3)],
    teammate: {
      ...team.teammate,
      gamerTag: LONG_TAGS[LONG_TAGS.length - 1 - index],
      prefix: LONG_PREFIXES[LONG_PREFIXES.length - 1 - index],
      characters: [...team.teammate.characters, ...extras((index + 1) % 4)],
    },
  };
});
const crowdedDoubles = {
  players: crowdedTeams,
  tournament: { ...longNameTournament, eventName: "Ultimate Doubles" },
};

// Golden-only cases: variations of built-in templates that exercise code the
// plain templates don't. They never become picker thumbnails.
const GOLDEN_ONLY_TEMPLATES: PreviewTemplate[] = [
  // Doubles: long names, extra characters, a team of one.
  {
    id: "kagaribi-doubles-crowded",
    name: "Kagaribi Doubles, long names",
    design: kagaribiDoublesDesign,
    font: "Dela Gothic One",
    ...crowdedDoubles,
  },
  {
    id: "tag-team-crowded",
    name: "Tag Team, long names",
    design: tagTeamDesign,
    font: "RocknRoll One",
    ...crowdedDoubles,
  },
  {
    id: "duet-crowded",
    name: "Duet, long names",
    design: duetDesign,
    font: "Shippori Mincho",
    ...crowdedDoubles,
  },
  {
    id: "minimal-dark-dynamic-height",
    name: "8 Players (Dark), multi-character",
    design: minimalDarkDesign,
    font: "Noto Sans JP",
    players: multiCharacterPlayers,
  },
  {
    id: "comic-book-cast",
    name: "Comic Book, varied cast",
    design: comicBookDesign,
    font: "Dela Gothic One",
    players: castPlayers,
  },
  {
    id: "neon-sign-cast",
    name: "Neon Sign, varied cast",
    design: neonSignDesign,
    font: "M PLUS Rounded 1c",
    players: castPlayers,
  },
  // Extra characters: two at full size, then a grid.
  {
    id: "neon-sign-multi",
    name: "Neon Sign, multi-character",
    design: neonSignDesign,
    font: "M PLUS Rounded 1c",
    players: multiCharacterPlayers,
  },
  {
    id: "high-score-cast",
    name: "High Score, varied cast",
    design: highScoreDesign,
    font: "DotGothic16",
    players: castPlayers,
  },
  {
    id: "high-score-multi",
    name: "High Score, multi-character",
    design: highScoreDesign,
    font: "DotGothic16",
    players: multiCharacterPlayers,
  },
  // Table columns: Name at its widest, Fighters narrowed to what is left.
  {
    id: "high-score-crowded",
    name: "High Score, long name and many characters",
    design: highScoreDesign,
    font: "DotGothic16",
    players: crowdedPlayers,
  },
  {
    id: "tape-cast",
    name: "Tape, varied cast",
    design: tapeDesign,
    font: "Dela Gothic One",
    players: castPlayers,
  },
  // Stacks of extra characters, wrapping into a second column.
  {
    id: "tape-multi",
    name: "Tape, multi-character",
    design: tapeDesign,
    font: "Dela Gothic One",
    players: multiCharacterPlayers,
  },
  // Tape that has to shrink, then cut, long names and sponsors; a title on
  // two lines beside the tournament's icon.
  {
    id: "tape-crowded",
    name: "Tape, long names",
    design: tapeDesign,
    font: "Dela Gothic One",
    players: longNamePlayers,
    tournament: longNameTournament,
  },
  {
    id: "colour-bars-cast",
    name: "Colour Bars, varied cast",
    design: colourBarsDesign,
    font: "Noto Sans JP",
    players: castPlayers,
  },
  {
    id: "colour-bars-multi",
    name: "Colour Bars, multi-character",
    design: colourBarsDesign,
    font: "Noto Sans JP",
    players: multiCharacterPlayers,
  },
  // A winner whose render is wider than it is tall: it has to fit the bar.
  {
    id: "colour-bars-wide",
    name: "Colour Bars, wide render",
    design: colourBarsDesign,
    font: "Noto Sans JP",
    players: castPlayers.map((player, index) =>
      index === 0
        ? {
            ...player,
            characters: [{ id: "1302", alt: 7 as CharacerData["alt"] }],
          }
        : player,
    ),
  },
  // Names that shrink, then cut, down the bars; a long title beside an icon.
  {
    id: "colour-bars-crowded",
    name: "Colour Bars, long names",
    design: colourBarsDesign,
    font: "Noto Sans JP",
    players: longNamePlayers,
    tournament: longNameTournament,
  },
  {
    id: "sleeve-cast",
    name: "Sleeve, varied cast",
    design: sleeveDesign,
    font: "Noto Sans JP",
    players: castPlayers,
  },
  {
    id: "sleeve-multi",
    name: "Sleeve, multi-character",
    design: sleeveDesign,
    font: "Noto Sans JP",
    players: multiCharacterPlayers,
  },
  // Names that shrink in the list rows; a title on several lines beside an
  // icon.
  {
    id: "sleeve-crowded",
    name: "Sleeve, long names",
    design: sleeveDesign,
    font: "Noto Sans JP",
    players: longNamePlayers,
    tournament: longNameTournament,
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
const PARAMS = new URLSearchParams(window.location.search);
const GOLDEN_MODE = PARAMS.get("mode") === "golden";
// `&only=<id>,<id>` renders just those templates, for looking at one design
// while working on it.
const ONLY = PARAMS.get("only")?.split(",");
const TEMPLATES = (
  GOLDEN_MODE
    ? [...BUILT_IN_TEMPLATES, ...GOLDEN_ONLY_TEMPLATES]
    : BUILT_IN_TEMPLATES
).filter((template) => !ONLY || ONLY.includes(template.id));
const CAPTURE_OPTIONS = GOLDEN_MODE
  ? { mimeType: "image/png", pixelRatio: 0.5 }
  : { mimeType: "image/webp", quality: 0.5 };

const TemplateRenderer = ({
  template,
  onCaptured,
}: {
  template: PreviewTemplate;
  onCaptured: (id: string, dataUrl: string) => void;
}) => {
  const stageRef = useRef<KonvaStage>(null);
  const basePlayers = template.players ?? lineupFor(template.id);
  const players = template.renderStyle
    ? applyRenderStyle(basePlayers, template.renderStyle)
    : basePlayers;
  const tournament = template.tournament ?? sampleTournament;
  const stageSize = getEffectiveCanvasSize(
    template.design,
    players,
    template.font,
    getUnusedIconSpace(template.design.tournamentIconSpace, tournament.iconSrc),
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
              tournament={tournament}
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
