import { Group, Image, Rect, Text } from "react-konva";
import useImage from "use-image";

import { PlayerInfo } from "@/types/top8/Result";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

type Props = {
  player: PlayerInfo;
  position?: { x: number; y: number };
  setSelectedPlayer: (player: PlayerInfo) => void;
  isSelected: boolean;
  placement: number;
};

export const Player = ({
  player,
  position = { x: 0, y: 0 },
  setSelectedPlayer,
  isSelected = false,
  placement,
}: Props) => {
  const [img, status] = useImage(
    getCharImgUrl({ characterId: player.character, alt: player.alt })
  );

  if (status === "loading" || !img) return null;

  return (
    <Group
      onClick={() => setSelectedPlayer(player)}
      draggable={isSelected}
      x={position.x}
      y={position.y}
    >
      <Rect
        x={0}
        y={0}
        width={100}
        height={100}
        fill={isSelected ? "blue" : "red"}
      />
      <Image x={0} y={0} image={img} />
      <Text x={0} y={10} fill={"white"} text={player.name} fontSize={16} />
      <Text
        x={0}
        y={40}
        fill={"white"}
        text={String(placement)}
        fontSize={24}
      />
      {player.twitter && (
        <Text x={0} y={70} fill={"white"} text={player.twitter} fontSize={24} />
      )}
    </Group>
  );
};
