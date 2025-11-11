import { useEffect, useRef, useState } from "react";
import { TextField } from "@radix-ui/themes";
import debounce from "lodash/debounce";

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
  const players = usePlayerStore((state) => state.players);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );
  const dispatch = usePlayerStore((state) => state.dispatch);

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
  }, [selectedPlayer, selectedPlayerIndex]);

  const debouncedUpdatePlayer = useRef(
    debounce((player: PlayerInfo, index: number) => {
      dispatch({
        type: "UPDATE_PLAYER",
        payload: { index, player },
      });
    }, 100)
  ).current;

  useEffect(() => {
    return () => {
      debouncedUpdatePlayer.cancel();
    };
  }, [debouncedUpdatePlayer]);

  useEffect(() => {
    if (selectedPlayer) {
      debouncedUpdatePlayer(player, selectedPlayerIndex);
    }
  }, [player, selectedPlayerIndex, debouncedUpdatePlayer, selectedPlayer]);

  return (
    <div className={className}>
      <TextField.Root
        type="text"
        value={player.prefix ?? ""}
        onChange={(e) => setPlayer({ ...player, prefix: e.target.value })}
        placeholder="Prefix"
        disabled={!selectedPlayer}
      />
      <TextField.Root
        type="text"
        value={player.gamerTag ?? ""}
        onChange={(e) => setPlayer({ ...player, gamerTag: e.target.value })}
        placeholder="Gamer Tag"
        disabled={!selectedPlayer}
      />
      <CharacterSelect
        selectedCharacterId={player.characters[0]?.id ?? ""}
        onValueChange={(id) =>
          setPlayer({ ...player, characters: [{ id, alt: 0 }] })
        }
        disabled={!selectedPlayer}
      />
      <CharacterAltRadio
        characterId={player.characters[0]?.id ?? ""}
        selectedAlt={player.characters[0]?.alt ?? 0}
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
    </div>
  );
};
