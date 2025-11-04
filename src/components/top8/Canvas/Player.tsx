import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Group, Image, Text, Transformer } from "react-konva";
import useImage from "use-image";

import playerFrame from "/assets/top8/theme/mini/frame.svg";

import { PlayerInfo } from "@/types/top8/Result";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { useSvgImage } from "@/hooks/top8/useSvgImage";

type Props = {
  player: PlayerInfo;
  position?: { x: number; y: number };
  setSelectedPlayerId: (playerId: string) => void;
  isSelected: boolean;
  placement: number;
  frameColor?: string; // Optional: custom frame color
};

export const Player = ({
  player,
  position: initialPosition = { x: 0, y: 0 },
  setSelectedPlayerId,
  isSelected = false,
  placement,
  frameColor = "red", // Use custom color if provided
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
  const [position, setPosition] = useState(initialPosition);
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
  };

  const handleMouseOut = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = "default";
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setPosition({ x: e.target.x(), y: e.target.y() });
  };

  const handleGroupClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setSelectedPlayerId(player.id);
  };

  return (
    <>
      <Group
        onClick={handleGroupClick}
        draggable={isSelected}
        x={position.x ?? 0}
        y={position.y ?? 0}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onDragEnd={handleDragEnd}
        ref={groupRef}
      >
        <Image x={0} y={0} image={img} />
        <Image id="frame" width={100} height={100} x={0} y={0} image={frame} />
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

      <Transformer ref={trRef} />
    </>
  );
};
