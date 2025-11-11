import { useEffect, useState } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { CharacterSelect } from "@/components/top8/CharacterSelect/CharacterSelect";
import { CharacterAltRadio } from "@/components/top8/CharacterAltRadio/CharacterAltRadio";
import { usePlayerStore } from "@/store/playerStore";
import { PlayerInfo } from "@/types/top8/Player";

type Props = {
  className?: string;
};

const DEFAULT_PLAYER: PlayerInfo = {
  id: `0`,
  name: "",
  characters: [{ id: "", alt: 0 }],
  placement: 0,
  gamerTag: "",
  prefix: "",
};

export const PlayerForm = ({ className }: Props) => {
  const { players, selectedPlayerIndex, dispatch } = usePlayerStore();
  const selectedPlayer = players[selectedPlayerIndex];

  const [player, setPlayer] = useState<PlayerInfo>(
    selectedPlayer || DEFAULT_PLAYER
  );

  useEffect(() => {
    if (selectedPlayer) {
      setPlayer(selectedPlayer);
    } else {
      setPlayer({
        ...DEFAULT_PLAYER,
        id: selectedPlayerIndex.toString(),
        placement: selectedPlayerIndex + 1,
      });
    }
  }, [selectedPlayer]);

  const handleSave = () => {
    if (!selectedPlayer) return;

    dispatch({
      type: "UPDATE_PLAYER",
      payload: { index: selectedPlayerIndex, player },
    });
  };

  return (
    <div className={className}>
      <TextField.Root
        type="text"
        value={player.prefix}
        onChange={(e) => setPlayer({ ...player, prefix: e.target.value })}
        placeholder="Prefix"
        disabled={!selectedPlayer}
      />
      <TextField.Root
        type="text"
        value={player.gamerTag}
        onChange={(e) => setPlayer({ ...player, gamerTag: e.target.value })}
        placeholder="Gamer Tag"
        disabled={!selectedPlayer}
      />
      <CharacterSelect
        selectedCharacterId={player.characters[0].id}
        onValueChange={(id) =>
          setPlayer({ ...player, characters: [{ id, alt: 0 }] })
        }
        disabled={!selectedPlayer}
      />
      <CharacterAltRadio
        characterId={player.characters[0].id}
        selectedAlt={player.characters[0].alt}
        onAltChange={(alt) =>
          setPlayer({
            ...player,
            characters: [
              { id: player.characters[0].id, alt },
              ...player.characters.slice(1),
            ],
          })
        }
        disabled={!selectedPlayer}
      />

      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};
