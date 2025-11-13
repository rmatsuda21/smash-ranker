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

  const editingPlayerIndexRef = useRef<number>(selectedPlayerIndex);
  const isLoadingPlayerRef = useRef<boolean>(false);

  useEffect(() => {
    debouncedUpdatePlayer.cancel();

    editingPlayerIndexRef.current = selectedPlayerIndex;
    isLoadingPlayerRef.current = true;

    if (selectedPlayer) {
      setPlayer(selectedPlayer);
    } else {
      setPlayer({
        ...DEFAULT_PLAYER,
        id: selectedPlayerIndex.toString(),
        placement: selectedPlayerIndex + 1,
      });
    }

    setTimeout(() => {
      isLoadingPlayerRef.current = false;
    }, 0);
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

  const updatePlayer = (updatedPlayer: PlayerInfo) => {
    setPlayer(updatedPlayer);

    if (
      selectedPlayer &&
      !isLoadingPlayerRef.current &&
      editingPlayerIndexRef.current === selectedPlayerIndex
    ) {
      debouncedUpdatePlayer(updatedPlayer, selectedPlayerIndex);
    }
  };

  return (
    <div className={className}>
      <TextField.Root
        type="text"
        value={player.prefix ?? ""}
        onChange={(e) => updatePlayer({ ...player, prefix: e.target.value })}
        placeholder="Prefix"
        disabled={!selectedPlayer}
      />
      <TextField.Root
        type="text"
        value={player.gamerTag ?? ""}
        onChange={(e) => updatePlayer({ ...player, gamerTag: e.target.value })}
        placeholder="Gamer Tag"
        disabled={!selectedPlayer}
      />
      <CharacterSelect
        selectedCharacterId={player.characters[0]?.id ?? ""}
        onValueChange={(id) =>
          updatePlayer({
            ...player,
            characters: [
              { id, alt: player.characters[0]?.alt ?? 0 },
              ...player.characters.slice(1),
            ],
          })
        }
        disabled={!selectedPlayer}
      />
      <CharacterAltRadio
        characterId={player.characters[0]?.id ?? ""}
        selectedAlt={player.characters[0]?.alt ?? 0}
        onAltChange={(alt) =>
          updatePlayer({
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
