import { useEffect, useState } from "react";

import { Button, Flex, Slider, TextField } from "@radix-ui/themes";
import { PlayerInfo } from "@/types/top8/Result";
import { CharacterSelect } from "@/components/top8/CharacterSelect";
import { characters } from "@/consts/top8/ultCharacters.json";
import { Player } from "@/js/top8/Player";
import { Graphic } from "@/js/top8/Graphic";

export const PlayerConfig = ({
  player,
  graphic,
}: {
  player: Player;
  graphic: Graphic;
}) => {
  const [name, setName] = useState(player.playerInfo.name || "");
  const [characterId, setCharacterId] = useState(
    player.playerInfo?.character || ""
  );
  const [alt, setAlt] = useState<PlayerInfo["alt"]>(
    player.playerInfo?.alt || 0
  );
  const [maxAlt, setMaxAlt] = useState(
    characters.find((c) => c.id === Number(characterId))?.alts || 0
  );

  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const updatedPlayerInfo: PlayerInfo = {
      ...player.playerInfo,
      name,
      character: characterId,
      alt,
    };

    await graphic.updatePlayer(player, updatedPlayerInfo);
    setLoading(false);
  };

  useEffect(() => {
    setName(player.playerInfo?.name || "");
    setCharacterId(player.playerInfo?.character || "");
    setAlt(player.playerInfo?.alt || 0);
    setMaxAlt(
      characters.find((c) => c.id === Number(player.playerInfo?.character))
        ?.alts || 0
    );
  }, [player]);

  useEffect(() => {
    setAlt(0);
  }, [characterId]);

  return (
    <>
      <form onSubmit={onSubmit}>
        <TextField.Root
          type="text"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.currentTarget.value);
          }}
          placeholder="ranker.png"
        />
        <Slider
          mt="7"
          mb="7"
          min={0}
          max={maxAlt}
          step={1}
          defaultValue={[alt]}
          value={[alt]}
          onValueChange={(e) => {
            setAlt(e[0] as PlayerInfo["alt"]);
          }}
        />
        <Flex>
          <CharacterSelect
            characterId={characterId}
            setCharacterId={setCharacterId}
          />
        </Flex>

        <Button loading={loading} type="submit">
          Submit
        </Button>
      </form>
    </>
  );
};
