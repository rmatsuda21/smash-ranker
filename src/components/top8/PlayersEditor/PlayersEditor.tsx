import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineUserRemove } from "react-icons/hi";
import debounce from "lodash/debounce";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { usePlayerStore } from "@/store/playerStore";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";
import { CharacterEditor } from "@/components/top8/CharacterEditor/CharacterEditor";
import { Input } from "@/components/shared/Input/Input";
import { Button } from "@/components/shared/Button/Button";
import { PlayerSelector } from "@/components/top8/PlayersEditor/PlayerSelector";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";
import { CountryDropDown } from "@/components/top8/PlayersEditor/CountryDropDown";
import { createBlankPlayer } from "@/utils/top8/samplePlayers";
import { useConfirmation } from "@/hooks/useConfirmation";

import styles from "./PlayersEditor.module.scss";

type Props = {
  className?: string;
};

export const PlayersEditor = ({ className }: Props) => {
  const { _ } = useLingui();
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

  const handleAssetSelect = (src: string) => {
    if (!tempPlayer) return;

    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      avatarImgSrc: src,
    };
    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  const handleClear = () => {
    if (!tempPlayer) return;

    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      avatarImgSrc: undefined,
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

  const handleCountryChange = (country: string) => {
    if (!tempPlayer) return;
    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      country,
    };
    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  const handleClearPlayer = () => {
    if (!tempPlayer) return;
    const blankPlayer = createBlankPlayer(tempPlayer.placement);
    setTempPlayer(blankPlayer);
    dispatch({
      type: "UPDATE_PLAYER",
      payload: { index: selectedPlayerIndex, player: blankPlayer },
    });
  };

  const {
    confirm: confirmClearPlayer,
    ConfirmationDialog: ClearPlayerConfirmation,
  } = useConfirmation(handleClearPlayer, {
    title: _(msg`Clear Player?`),
    description: _(msg`This will reset all player data for this slot.`),
  });

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.playerSelector}>
        <PlayerSelector />
      </div>
      <div className={cn({ [styles.disabled]: !selectedPlayer })}>
        <p className={styles.label}>
          <Trans>Characters</Trans>
        </p>
        <CharacterEditor
          characters={tempPlayer?.characters ?? []}
          onCharactersChange={handleCharactersChange}
          disabled={!selectedPlayer}
        />
      </div>
      <Input
        id="prefix"
        name="prefix"
        type="text"
        label={_(msg`Prefix`)}
        value={tempPlayer?.prefix ?? ""}
        onChange={handleChange}
        placeholder={_(msg`Prefix`)}
        disabled={!selectedPlayer}
      />
      <Input
        id="gamerTag"
        name="gamerTag"
        type="text"
        label={_(msg`Gamer Tag`)}
        value={tempPlayer?.gamerTag ?? ""}
        onChange={handleChange}
        placeholder={_(msg`Gamer Tag`)}
        disabled={!selectedPlayer}
      />
      <Input
        id="twitter"
        name="twitter"
        type="text"
        label={_(msg`Twitter`)}
        value={tempPlayer?.twitter ?? ""}
        onChange={handleChange}
        placeholder={_(msg`Twitter`)}
        disabled={!selectedPlayer}
      />
      <div className={cn({ [styles.disabled]: !selectedPlayer })}>
        <p className={styles.label}>
          <Trans>Country</Trans>
        </p>
        <CountryDropDown
          selectedCountry={tempPlayer?.country ?? ""}
          onCountryChange={handleCountryChange}
          disabled={!selectedPlayer}
        />
      </div>
      <div className={cn({ [styles.disabled]: !selectedPlayer })}>
        <p className={styles.label}>
          <Trans>Avatar</Trans>
        </p>
        <AssetSelector
          selectedSrc={tempPlayer?.avatarImgSrc}
          onSelect={handleAssetSelect}
          onClear={handleClear}
          disabled={!selectedPlayer}
        />
      </div>
      <Button
        variant="outline"
        onClick={confirmClearPlayer}
        disabled={!selectedPlayer}
      >
        <HiOutlineUserRemove /> <Trans>Clear Player</Trans>
      </Button>
      <ClearPlayerConfirmation />
    </div>
  );
};
