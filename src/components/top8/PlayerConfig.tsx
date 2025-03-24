import { FabricObject } from "fabric";
import { useEffect, useState } from "react";

import { Button, Flex, Slider, TextField } from "@radix-ui/themes";
import { redrawPlayer } from "@/utils/top8/redrawPlayer";
import { Player } from "@/types/top8/Result";
import { CharacterSelect } from "@/components/top8/CharacterSelect";
import { characters } from "@/consts/top8/ultCharacters.json";

export const PlayerConfig = ({ playerObj }: { playerObj: FabricObject }) => {
  const [name, setName] = useState(playerObj.playerInfo?.name || "");
  const [characterId, setCharacterId] = useState(
    playerObj.playerInfo?.character || ""
  );
  const [alt, setAlt] = useState<Player["alt"]>(playerObj.playerInfo?.alt || 0);
  const [maxAlt, setMaxAlt] = useState(
    characters.find((c) => c.id === Number(characterId))?.alts || 0
  );

  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const player: Player = {
      id: playerObj.id || "",
      name: name,
      character: characterId,
      alt: alt || 0,
      placement: playerObj.playerInfo?.placement || 0,
    };

    await redrawPlayer({
      playerObj,
      player,
    });

    setLoading(false);
  };

  useEffect(() => {
    setName(playerObj.playerInfo?.name || "");
    setCharacterId(playerObj.playerInfo?.character || "");
    setAlt(playerObj.playerInfo?.alt || 0);
    setMaxAlt(
      characters.find((c) => c.id === Number(playerObj.playerInfo?.character))
        ?.alts || 0
    );
  }, [playerObj]);

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
            setAlt(e[0] as Player["alt"]);
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
