import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import Konva from "konva";
import { Group, Rect, Text, Transformer } from "react-konva";
import { SceneContext } from "konva/lib/Context";
import isEqual from "lodash/isEqual";

import { PlayerInfo } from "@/types/top8/Player";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import { useCanvasStore } from "@/store/canvasStore";
import { fetchAndColorSVG } from "@/utils/top8/fetchAndColorSVG";
import { usePlayerStore } from "@/store/playerStore";
import { SmartText } from "@/components/top8/SmartText/SmartText";

import playerFrame from "/assets/top8/theme/mini/frame.svg";

type Props = {
  player: PlayerInfo;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  scale?: { x: number; y: number };
  index: number;
  onDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
};

const AltGroup = memo(
  ({
    playerId,
    characters,
    size = 40,
    gap = 5,
    x,
    y,
  }: {
    playerId: string;
    characters: string[];
    x: number;
    y: number;
    size?: number;
    gap?: number;
  }) => {
    return (
      <Group x={x} y={y}>
        {characters.map((character, index) => (
          <CustomImage
            key={`${playerId}-alt-${index}`}
            id="alternate-character"
            x={0}
            y={index * (size + gap)}
            width={size}
            height={size}
            imageSrc={character}
          />
        ))}
      </Group>
    );
  },
  (prevProps, nextProps) => {
    return isEqual(prevProps.characters, nextProps.characters);
  }
);

const PlayerComponent = ({
  player,
  index,
  position: initialPosition = { x: 0, y: 0 },
  size: initialSize = { width: 100, height: 100 },
  scale: initialScale = { x: 1, y: 1 },
  onDragStart,
  onDragEnd,
}: Props) => {
  const [size] = useState(initialSize);
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState(initialPosition);
  const [isHovered, setIsHovered] = useState(false);

  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [frameImageSrc, setFrameImageSrc] = useState<string>();

  const canvasSize = useCanvasStore((state) => state.size);
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const fonts = useCanvasStore((state) => state.fonts);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );
  const dispatch = usePlayerStore((state) => state.dispatch);
  const isSelected = selectedPlayerIndex === index;

  useEffect(() => {
    const fetchFrameImageSrc = async () => {
      const url = await fetchAndColorSVG(playerFrame, "rgba(255, 0, 0, 0.8)");
      if (url) {
        setFrameImageSrc(url);
      }
    };
    fetchFrameImageSrc();
  }, []);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current as Konva.Node]);
    } else if (!isSelected && trRef.current) {
      trRef.current.nodes([]);
    }
  }, [isSelected]);

  const handleMouseOver = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const container = e.target.getStage()?.container();
      if (container) {
        container.style.cursor = "pointer";
      }

      setIsHovered(true);
    },
    []
  );

  const handleMouseOut = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const container = e.target.getStage()?.container();
      if (container) {
        container.style.cursor = "default";
      }

      setIsHovered(false);
    },
    []
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      setPosition({ x: e.target.x(), y: e.target.y() });
      onDragEnd(e);
    },
    [onDragEnd]
  );

  const handleGroupClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      dispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: index });
    },
    [index, dispatch]
  );

  const handleTransform = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      setScale({ x: e.target.scaleX(), y: e.target.scaleY() });
    },
    []
  );

  const dragBoundFunc = useCallback(
    (pos: Konva.Vector2d) => {
      return {
        x: Math.max(
          0,
          Math.min(pos.x, canvasSize.width - size.width * scale.x)
        ),
        y: Math.max(
          0,
          Math.min(pos.y, canvasSize.height - size.height * scale.y)
        ),
      };
    },
    [
      canvasSize.width,
      canvasSize.height,
      size.width,
      size.height,
      scale.x,
      scale.y,
    ]
  );

  const clipFunc = useCallback(
    (ctx: SceneContext) => {
      ctx.beginPath();
      ctx.rect(0, 0, size.width, size.height);
      ctx.closePath();
    },
    [size.width, size.height]
  );

  const characterImageSrc = useMemo(() => {
    return getCharImgUrl({
      characterId: player.characters[0].id,
      alt: player.characters[0].alt,
    });
  }, [player.characters[0].id, player.characters[0].alt]);

  const fontFamily = useMemo(() => {
    return fonts[selectedFont] === "loaded" ? selectedFont : "Arial";
  }, [selectedFont, fonts]);

  const name = useMemo(
    () => `${player.prefix ? `${player.prefix} | ` : ""}${player.gamerTag}`,
    [player.prefix, player.gamerTag]
  );

  const alternateCharacters = useMemo(() => {
    return player.characters.slice(1).map((character) => {
      return getCharImgUrl({
        characterId: character.id,
        alt: character.alt,
        type: "stock",
      });
    });
  }, [player.characters]);

  return (
    <>
      <Group
        ref={groupRef}
        draggable={isSelected}
        x={position.x ?? 0}
        y={position.y ?? 0}
        width={size.width}
        height={size.height}
        scaleX={scale.x}
        scaleY={scale.y}
        onClick={handleGroupClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onDragEnd={handleDragEnd}
        onDragStart={onDragStart}
        dragBoundFunc={dragBoundFunc}
        name={player.id}
      >
        <Rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill={"black"}
        />
        <Rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill={isHovered ? "rgba(255, 255, 255, 0.2)" : "transparent"}
        />
        <Group clipFunc={clipFunc}>
          <CustomImage
            id="character"
            y={0}
            x={0}
            width={size.width}
            height={size.height}
            offset={{ x: 0, y: 100 }}
            imageSrc={characterImageSrc}
            hasShadow
          />
        </Group>
        <AltGroup
          playerId={player.id}
          characters={alternateCharacters}
          x={size.width - 65}
          y={15}
          size={50}
          gap={5}
        />
        <CustomImage
          id="frame"
          width={size.width}
          height={size.height}
          x={0}
          y={0}
          imageSrc={frameImageSrc ?? ""}
        />
        <SmartText
          width={size.width}
          verticalAlign="bottom"
          x={0}
          y={size.height - 10}
          fill={"white"}
          text={name}
          fontSize={65}
          fontFamily={fontFamily}
          fontStyle="900"
          shadowColor={"black"}
          shadowBlur={0}
          shadowOffset={{ x: 6, y: 6 }}
          shadowOpacity={1}
          align="center"
        />
        <Text
          width={75}
          height={75}
          x={20}
          y={10}
          fill={"white"}
          text={String(player.placement)}
          fontSize={75}
          fontStyle="bold"
          fontFamily={fontFamily}
          stroke={"white"}
          strokeWidth={7}
        />

        {player.twitter && (
          <Text
            x={0}
            y={70}
            fill={"white"}
            text={player.twitter}
            fontSize={24}
          />
        )}
      </Group>
      <Transformer
        name={`transformer-${player.id}`}
        ref={trRef}
        onTransform={handleTransform}
      />
    </>
  );
};

export const Player = memo(PlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.gamerTag === nextProps.player.gamerTag &&
    prevProps.player.prefix === nextProps.player.prefix &&
    prevProps.player.twitter === nextProps.player.twitter &&
    isEqual(prevProps.player.characters, nextProps.player.characters) &&
    prevProps.index === nextProps.index &&
    prevProps.position?.x === nextProps.position?.x &&
    prevProps.position?.y === nextProps.position?.y &&
    prevProps.size?.width === nextProps.size?.width &&
    prevProps.size?.height === nextProps.size?.height &&
    prevProps.scale?.x === nextProps.scale?.x &&
    prevProps.scale?.y === nextProps.scale?.y
  );
});
