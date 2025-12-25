import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import cn from "classnames";

import { usePlayerStore } from "@/store/playerStore";
import { CharacerData, PlayerInfo } from "@/types/top8/PlayerTypes";
import { CharacterEditor } from "@/components/top8/CharacterEditor/CharacterEditor";
import { Input } from "@/components/shared/Input/Input";
import { PlayerSelector } from "@/components/top8/PlayerForm/PlayerSelector";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";

import styles from "./PlayerForm.module.scss";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tempPlayer) return;
    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      [e.target.name]: e.target.value,
    };
    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  const handleAssetSelect = (id: string) => {
    if (!tempPlayer) return;

    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      avatarAssetId: id,
    };
    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  const handleClear = () => {
    if (!tempPlayer) return;

    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      avatarAssetId: undefined,
    };
    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  const handleCharactersChange = (characters: CharacerData[]) => {
    if (!tempPlayer) return;
    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      characters,
    };
    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.playerSelector}>
        <PlayerSelector />
      </div>
      <Input
        id="prefix"
        name="prefix"
        type="text"
        label="Prefix"
        value={tempPlayer?.prefix ?? ""}
        onChange={handleChange}
        placeholder="Prefix"
        disabled={!selectedPlayer}
      />
      <Input
        id="gamerTag"
        name="gamerTag"
        type="text"
        label="Gamer Tag"
        value={tempPlayer?.gamerTag ?? ""}
        onChange={handleChange}
        placeholder="Gamer Tag"
        disabled={!selectedPlayer}
      />
      <Input
        id="twitter"
        name="twitter"
        type="text"
        label="Twitter"
        value={tempPlayer?.twitter ?? ""}
        onChange={handleChange}
        placeholder="Twitter"
        disabled={!selectedPlayer}
      />
      <div className={cn({ [styles.disabled]: !selectedPlayer })}>
        <p className={styles.label}>Avatar</p>
        <AssetSelector
          selectedId={tempPlayer?.avatarAssetId}
          onSelect={handleAssetSelect}
          onClear={handleClear}
        />
      </div>
      <div className={cn({ [styles.disabled]: !selectedPlayer })}>
        <p className={styles.label}>Characters</p>
        <CharacterEditor
          characters={tempPlayer?.characters ?? []}
          onCharactersChange={handleCharactersChange}
          disabled={!selectedPlayer}
        />
      </div>
    </div>
  );
};
