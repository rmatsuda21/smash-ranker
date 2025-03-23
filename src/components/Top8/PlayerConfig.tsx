import { FabricObject } from "fabric";
import { useEffect, useState } from "react";

import { Button, Flex, Slider, TextField } from "@radix-ui/themes";
import { redrawPlayer } from "@/utils/top8/redrawPlayer";
import { Player } from "@/types/top8/Result";
import { CharacterSelect } from "@/components/top8/CharacterSelect";

export const PlayerConfig = ({ playerObj }: { playerObj: FabricObject }) => {
  const [name, setName] = useState(playerObj.playerName || "");
  const [characterId, setCharacterId] = useState(playerObj.characterId || "");
  const [alt, setAlt] = useState<Player["alt"]>(playerObj.alt || 0);

  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const player: Player = {
      id: playerObj.id || "",
      name: name,
      character: characterId,
      alt: alt || 0,
      placement: playerObj.placement || 0,
    };

    await redrawPlayer({
      playerObj,
      player,
    });

    setLoading(false);
  };

  useEffect(() => {
    console.log("playerObj:", playerObj.characterId);
    setName(playerObj.playerName || "");
    setCharacterId(playerObj.characterId || "");
    setAlt(playerObj.alt || 0);
  }, [playerObj]);

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
          max={7}
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
