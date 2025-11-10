import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Group, Rect, Text, Transformer } from "react-konva";
import { SceneContext } from "konva/lib/Context";

import { PlayerInfo } from "@/types/top8/Result";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import { useCanvasStore } from "@/store/canvasStore";
import { fetchAndColorSVG } from "@/utils/top8/fetchAndColorSVG";

import playerFrame from "/assets/top8/theme/mini/frame.svg";
import { usePlayerStore } from "@/store/playerStore";

type Props = {
  player: PlayerInfo;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  index: number;
  placement: number;
  onDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
};

export const Player = ({
  player,
  index,
  position: initialPosition = { x: 0, y: 0 },
  size: initialSize = { width: 100, height: 100 },
  placement,
  onDragStart,
  onDragEnd,
}: Props) => {
  const [size] = useState(initialSize);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [position, setPosition] = useState(initialPosition);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [frameImageSrc, setFrameImageSrc] = useState<string>();

  const { size: canvasSize, selectedFont, fonts } = useCanvasStore();
  const { selectedPlayerIndex, dispatch } = usePlayerStore();
  const isSelected = selectedPlayerIndex === index;

  useEffect(() => {
    const fetchFrameImageSrc = async () => {
      const url = await fetchAndColorSVG(playerFrame, "rgba(0, 0, 0, 0.8)");
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
      characterId: player.characterId,
      alt: player.alt,
    });
  }, [player.characterId, player.alt]);

  const fontFamily = useMemo(() => {
    return fonts[selectedFont] === "loaded" ? selectedFont : "Arial";
  }, [selectedFont, fonts]);

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
        clipFunc={clipFunc}
      >
        <Rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill={isHovered ? "rgba(255, 255, 255, 0.2)" : "transparent"}
        />
        <CustomImage
          id="character"
          y={0}
          x={0}
          width={size.width}
          height={size.height}
          offset={{ x: 0, y: 100 }}
          imageSrc={characterImageSrc}
          hasBackdrop
        />
        <CustomImage
          id="frame"
          width={size.width}
          height={size.height}
          x={0}
          y={0}
          imageSrc={frameImageSrc ?? ""}
        />
        <Text
          x={0}
          y={10}
          fill={"white"}
          text={player.name}
          fontSize={16}
          fontFamily={fontFamily}
        />
        <Text
          x={0}
          y={40}
          fill={"white"}
          text={String(placement)}
          fontSize={32}
          fontFamily={fontFamily}
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
      <Transformer ref={trRef} onTransform={handleTransform} />
    </>
  );
};
