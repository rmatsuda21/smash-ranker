import { useEffect, useRef, useState } from "react";
import { TextField } from "@radix-ui/themes";
import debounce from "lodash/debounce";

import { usePlayerStore } from "@/store/playerStore";
import { PlayerInfo } from "@/types/top8/Player";
import { CharacterEditor } from "@/components/top8/CharacterEditor/CharacterEditor";

type Props = {
  className?: string;
};

export const PlayerForm = ({ className }: Props) => {
  const players = usePlayerStore((state) => state.players);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );
  const dispatch = usePlayerStore((state) => state.dispatch);

  const [tempPlayer, setTempPlayer] = useState<PlayerInfo | undefined>(
    players[selectedPlayerIndex]
  );

  const selectedPlayer = players[selectedPlayerIndex];

  const editingPlayerIndexRef = useRef<number>(selectedPlayerIndex);
  const isLoadingPlayerRef = useRef<boolean>(false);

  useEffect(() => {
    debouncedUpdatePlayer.cancel();

    editingPlayerIndexRef.current = selectedPlayerIndex;
    isLoadingPlayerRef.current = true;

    if (selectedPlayer) {
      setTempPlayer(selectedPlayer);
    } else {
      setTempPlayer(undefined);
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
  }, []);

  const updatePlayer = (updatedPlayer: PlayerInfo) => {
    setTempPlayer(updatedPlayer);

    if (
      selectedPlayer &&
      !isLoadingPlayerRef.current &&
      editingPlayerIndexRef.current === selectedPlayerIndex
    ) {
      debouncedUpdatePlayer(updatedPlayer, selectedPlayerIndex);
    }
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tempPlayer) return;
    updatePlayer({ ...tempPlayer, prefix: e.target.value });
  };

  const handleGamerTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tempPlayer) return;
    updatePlayer({ ...tempPlayer, gamerTag: e.target.value });
  };

  return (
    <div className={className}>
      <TextField.Root
        type="text"
        value={tempPlayer?.prefix ?? ""}
        onChange={handlePrefixChange}
        placeholder="Prefix"
        disabled={!selectedPlayer}
      />
      <TextField.Root
        type="text"
        value={tempPlayer?.gamerTag ?? ""}
        onChange={handleGamerTagChange}
        placeholder="Gamer Tag"
        disabled={!selectedPlayer}
      />
      <CharacterEditor
        player={tempPlayer}
        updatePlayer={updatePlayer}
        disabled={!selectedPlayer}
      />
    </div>
  );
};
