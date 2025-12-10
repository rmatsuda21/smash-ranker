import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";

import { usePlayerStore } from "@/store/playerStore";
import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { CharacterEditor } from "@/components/top8/CharacterEditor/CharacterEditor";
import { FileUploader } from "@/components/top8/PlayerForm/FileUploader/FileUploader";
import { Input } from "@/components/shared/Input/Input";

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

  const selectedPlayer = useMemo(
    () => players[selectedPlayerIndex],
    [players, selectedPlayerIndex]
  );

  const editingPlayerIndexRef = useRef<number>(selectedPlayerIndex);
  const isLoadingPlayerRef = useRef<boolean>(false);

  const debouncedUpdatePlayer = useRef(
    debounce((player: PlayerInfo, index: number) => {
      dispatch({
        type: "UPDATE_PLAYER",
        payload: { index, player },
      });
    }, 100)
  ).current;

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

    return () => {
      debouncedUpdatePlayer.cancel();
    };
  }, [selectedPlayer, selectedPlayerIndex, dispatch, debouncedUpdatePlayer]);

  const updatePlayer = useCallback(
    (updatedPlayer: PlayerInfo) => {
      setTempPlayer(updatedPlayer);

      if (
        selectedPlayer &&
        !isLoadingPlayerRef.current &&
        editingPlayerIndexRef.current === selectedPlayerIndex
      ) {
        debouncedUpdatePlayer(updatedPlayer, selectedPlayerIndex);
      }
    },
    [setTempPlayer, selectedPlayer, debouncedUpdatePlayer, selectedPlayerIndex]
  );

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tempPlayer) return;
    updatePlayer({ ...tempPlayer, prefix: e.target.value });
  };

  const handleGamerTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tempPlayer) return;
    updatePlayer({ ...tempPlayer, gamerTag: e.target.value });
  };

  const handleCustomImgSrcChange = (file?: File) => {
    if (!tempPlayer || !file) return;
    const url = URL.createObjectURL(file);
    updatePlayer({ ...tempPlayer, customCharImgSrc: url });
  };

  return (
    <div className={className}>
      <Input
        id="prefix"
        type="text"
        value={tempPlayer?.prefix ?? ""}
        onChange={handlePrefixChange}
        placeholder="Prefix"
        disabled={!selectedPlayer}
      />
      <Input
        id="gamerTag"
        type="text"
        value={tempPlayer?.gamerTag ?? ""}
        onChange={handleGamerTagChange}
        placeholder="Gamer Tag"
        disabled={!selectedPlayer}
      />
      <FileUploader
        value={tempPlayer?.customCharImgSrc}
        disabled={!selectedPlayer}
        onChange={handleCustomImgSrcChange}
      />
      <CharacterEditor
        player={tempPlayer}
        updatePlayer={updatePlayer}
        disabled={!selectedPlayer}
      />
    </div>
  );
};
