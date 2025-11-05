import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Group, Image, Rect, Text, Transformer } from "react-konva";
import useImage from "use-image";

import { PlayerInfo } from "@/types/top8/Result";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { useSvgImage } from "@/hooks/top8/useSvgImage";
import { ContainedImage } from "@/components/top8/Canvas/ContainedImage";
import { CanvasConfig } from "@/types/top8/Canvas";

import playerFrame from "/assets/top8/theme/mini/frame.svg";
import { SceneContext } from "konva/lib/Context";

type Props = {
  player: PlayerInfo;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  setSelectedPlayerId: (playerId: string) => void;
  isSelected: boolean;
  placement: number;
  frameColor?: string;
  canvasConfig: CanvasConfig;
};

export const Player = ({
  player,
  position: initialPosition = { x: 0, y: 0 },
  size: initialSize = { width: 100, height: 100 },
  setSelectedPlayerId,
  isSelected = false,
  placement,
  frameColor = "red", // Use custom color if provided
  canvasConfig,
}: Props) => {
  const [img, status] = useImage(
    getCharImgUrl({ characterId: player.character, alt: player.alt }),
    "anonymous"
  );
  const [frame, frameStatus] = useSvgImage(
    playerFrame,
    frameColor,
    "anonymous"
  );

  const [size] = useState(initialSize);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [position, setPosition] = useState(initialPosition);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current as Konva.Node]);
    } else if (!isSelected && trRef.current) {
      trRef.current.nodes([]);
    }
  }, [img, frame, isSelected]);

  if (status === "loading" || !img || frameStatus === "loading" || !frame)
    return null;

  const handleMouseOver = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = "pointer";
    }

    setIsHovered(true);
  };

  const handleMouseOut = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = "default";
    }

    setIsHovered(false);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setPosition({ x: e.target.x(), y: e.target.y() });
  };

  const handleGroupClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setSelectedPlayerId(player.id);
  };

  const handleTransform = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setScale({ x: e.target.scaleX(), y: e.target.scaleY() });
  };

  const dragBoundFunc = (pos: Konva.Vector2d) => {
    return {
      x: Math.max(
        0,
        Math.min(pos.x, canvasConfig.size.width - size.width * scale.x)
      ),
      y: Math.max(
        0,
        Math.min(pos.y, canvasConfig.size.height - size.height * scale.y)
      ),
    };
  };

  const clipFunc = (ctx: SceneContext) => {
    ctx.beginPath();
    ctx.rect(0, 0, size.width, size.height);
    ctx.closePath();
  };

  const boundBoxFunc = (_oldBox: any, _newBox: any) => {
    return {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      rotation: 0,
    };
  };

  return (
    <>
      <Group
        onClick={handleGroupClick}
        draggable={isSelected}
        x={position.x ?? 0}
        y={position.y ?? 0}
        width={size.width}
        height={size.height}
        scaleX={scale.x}
        scaleY={scale.y}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onDragEnd={handleDragEnd}
        stroke="red"
        ref={groupRef}
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
        <ContainedImage
          id="character"
          y={100}
          width={size.width}
          height={size.height}
          image={img}
          hasBackdrop
        />
        <Image
          id="frame"
          width={size.width}
          height={size.height}
          x={0}
          y={0}
          image={frame}
        />
        <Text x={0} y={10} fill={"white"} text={player.name} fontSize={16} />
        <Text
          x={0}
          y={40}
          fill={"white"}
          text={String(placement)}
          fontSize={24}
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
        ref={trRef}
        onTransform={handleTransform}
        boundBoxFunc={boundBoxFunc}
      />
    </>
  );
};
