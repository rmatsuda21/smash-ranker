import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineUserRemove } from "react-icons/hi";
import { FaChevronDown, FaPlus, FaUser } from "react-icons/fa6";
import cn from "classnames";
import debounce from "lodash/debounce";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { usePlayerStore } from "@/store/playerStore";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";
import { CharacterEditor } from "@/components/top8/CharacterEditor/CharacterEditor";
import { Button } from "@/components/shared/Button/Button";
import { PlayerSelector } from "@/components/top8/PlayersEditor/PlayerSelector";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";
import { CountryDropDown } from "@/components/top8/PlayersEditor/CountryDropDown";
import {
  EditorCard,
  EditorPanel,
  Field,
  FieldGroup,
  FieldRow,
  FieldStack,
} from "@/components/top8/EditorForm/EditorForm";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { createBlankPlayer } from "@/utils/top8/samplePlayers";
import { useConfirmation } from "@/hooks/useConfirmation";
import { usePlayerCount } from "@/hooks/top8/usePlayerCount";
import { PlayerCountControl } from "@/components/top8/PlayersEditor/PlayerCountControl";

import styles from "./PlayersEditor.module.scss";

type Props = {
  className?: string;
};

export const PlayersEditor = ({ className }: Props) => {
  const { _ } = useLingui();
  const players = usePlayerStore((state) => state.players);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex,
  );
  const dispatch = usePlayerStore((state) => state.dispatch);
  const playerCount = usePlayerCount();

  const [tempPlayer, setTempPlayer] = useState<PlayerInfo | undefined>(
    players[selectedPlayerIndex],
  );

  const selectedPlayer = useMemo(
    () => players[selectedPlayerIndex],
    [players, selectedPlayerIndex],
  );

  // null = follow the player: open only when a custom image is already set.
  const [isCustomOpen, setIsCustomOpen] = useState<boolean | null>(null);

  const editingPlayerIndexRef = useRef<number>(selectedPlayerIndex);
  const isLoadingPlayerRef = useRef<boolean>(false);

  const debouncedUpdatePlayer = useRef(
    debounce((player: PlayerInfo, index: number) => {
      dispatch({
        type: "UPDATE_PLAYER",
        payload: { index, player },
      });
    }, 100),
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

  const handlePlacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tempPlayer) return;
    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      placement: parseInt(e.target.value, 10) || 0,
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

  const handleCustomFlagSelect = (src: string) => {
    if (!tempPlayer) return;

    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      customFlagSrc: src,
    };
    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  const handleCustomFlagClear = () => {
    if (!tempPlayer) return;

    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      customFlagSrc: undefined,
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
    confirmationDialog: clearPlayerConfirmation,
  } = useConfirmation(handleClearPlayer, {
    title: _(msg`Clear Player?`),
    description: _(msg`This will reset all player data for this slot.`),
  });

  const disabled = !selectedPlayer;
  const mainCharacter = tempPlayer?.characters[0];
  const hasCustomImages = Boolean(
    tempPlayer?.avatarImgSrc || tempPlayer?.customFlagSrc,
  );
  // Rarely used, so tucked away unless this player already has one set.
  const showCustomImages = isCustomOpen ?? hasCustomImages;

  return (
    <EditorPanel className={className}>
      {playerCount.adjustable && (
        <PlayerCountControl
          count={playerCount.count}
          min={playerCount.min}
          max={playerCount.max}
          onChange={playerCount.setCount}
        />
      )}
      <div className={styles.playerSelector} role="group">
        <PlayerSelector />
        {playerCount.adjustable && playerCount.count < playerCount.max && (
          <button
            type="button"
            className={cn(styles.slot, styles.addSlot)}
            onClick={() => playerCount.setCount(playerCount.count + 1)}
            aria-label={_(msg`Add player`)}
            title={_(msg`Add player`)}
          >
            <FaPlus size={12} />
          </button>
        )}
      </div>

      <EditorCard disabled={disabled}>
        <div className={styles.nameplate}>
          <div className={styles.portrait} aria-hidden="true">
            {mainCharacter ? (
              <img
                className={styles.portraitImg}
                src={getCharImgUrl({
                  characterId: mainCharacter.id,
                  alt: mainCharacter.alt,
                  type: "main",
                })}
                alt=""
                draggable={false}
              />
            ) : (
              <FaUser size={24} />
            )}
            {tempPlayer?.country && (
              <img
                className={styles.portraitFlag}
                src={`/assets/flags/${tempPlayer.country.toLowerCase()}.svg`}
                alt=""
              />
            )}
          </div>
          <FieldStack>
            <Field
              strong
              id="gamerTag"
              name="gamerTag"
              type="text"
              autoComplete="off"
              aria-label={_(msg`Gamer Tag`)}
              placeholder={_(msg`Gamer Tag`)}
              value={tempPlayer?.gamerTag ?? ""}
              onChange={handleChange}
              disabled={disabled}
            />
            <FieldRow className={styles.prefixRow}>
              <Field
                id="prefix"
                name="prefix"
                type="text"
                autoComplete="off"
                aria-label={_(msg`Prefix`)}
                placeholder={_(msg`Prefix`)}
                value={tempPlayer?.prefix ?? ""}
                onChange={handleChange}
                disabled={disabled}
              />
              <Field
                wrapperClassName={styles.placementField}
                id="placement"
                name="placement"
                type="number"
                min={0}
                inputMode="numeric"
                aria-label={_(msg`Placement`)}
                title={_(msg`Placement`)}
                prefix="#"
                value={tempPlayer?.placement ?? ""}
                onChange={handlePlacementChange}
                disabled={disabled}
              />
            </FieldRow>
          </FieldStack>
        </div>
        <CharacterEditor
          characters={tempPlayer?.characters ?? []}
          onCharactersChange={handleCharactersChange}
          disabled={disabled}
        />
      </EditorCard>

      <EditorCard disabled={disabled}>
        <Field
          id="twitter"
          name="twitter"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          label={_(msg`X Handle`)}
          prefix="@"
          value={tempPlayer?.twitter ?? ""}
          onChange={handleChange}
          disabled={disabled}
        />
        <FieldGroup label={<Trans>Country</Trans>}>
          <CountryDropDown
            selectedCountry={tempPlayer?.country ?? ""}
            onCountryChange={handleCountryChange}
            disabled={disabled}
          />
        </FieldGroup>

        <div className={styles.custom}>
          <button
            type="button"
            className={styles.customToggle}
            onClick={() => setIsCustomOpen(!showCustomImages)}
            aria-expanded={showCustomImages}
            aria-controls="player-custom-images"
          >
            <Trans>Custom images</Trans>
            <FaChevronDown
              className={cn(styles.chevron, {
                [styles.open]: showCustomImages,
              })}
              size={10}
            />
          </button>
          {showCustomImages && (
            <FieldRow id="player-custom-images">
              <FieldGroup label={<Trans>Avatar</Trans>}>
                <AssetSelector
                  selectedSrc={tempPlayer?.avatarImgSrc}
                  onSelect={handleAssetSelect}
                  onClear={handleClear}
                  disabled={disabled}
                />
              </FieldGroup>
              <FieldGroup label={<Trans>Custom Flag</Trans>}>
                <AssetSelector
                  selectedSrc={tempPlayer?.customFlagSrc}
                  onSelect={handleCustomFlagSelect}
                  onClear={handleCustomFlagClear}
                  disabled={disabled}
                />
              </FieldGroup>
            </FieldRow>
          )}
        </div>
      </EditorCard>

      <Button
        variant="subtle"
        className={styles.clearPlayer}
        onClick={confirmClearPlayer}
        disabled={disabled}
      >
        <HiOutlineUserRemove /> <Trans>Clear Player</Trans>
      </Button>
      {clearPlayerConfirmation}
    </EditorPanel>
  );
};
