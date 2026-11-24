import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineUserRemove } from "react-icons/hi";
import { FaChevronDown, FaPlus, FaUser } from "react-icons/fa6";
import cn from "classnames";
import debounce from "lodash/debounce";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import {
  CharacerData,
  PlayerInfo,
  TeamMember,
  TeammateInfo,
} from "@/types/top8/Player";
import { RadioGroup } from "@/components/shared/RadioGroup/RadioGroup";
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
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { createBlankPlayer } from "@/utils/top8/samplePlayers";
import { useConfirmation } from "@/hooks/useConfirmation";
import { usePlayerCount } from "@/hooks/top8/usePlayerCount";
import { PlayerCountControl } from "@/components/top8/PlayersEditor/PlayerCountControl";

import styles from "./PlayersEditor.module.scss";

type Props = {
  className?: string;
};

// What the second player's fields show until something is typed into them.
const BLANK_TEAMMATE: TeammateInfo = {
  name: "",
  gamerTag: "",
  prefix: "",
  characters: [{ id: EMPTY_CHARACTER_ID, alt: 0 }],
  twitter: "",
  country: "",
};

export const PlayersEditor = ({ className }: Props) => {
  const { _ } = useLingui();
  const players = usePlayerStore((state) => state.players);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex,
  );
  const dispatch = usePlayerStore((state) => state.dispatch);
  const playerCount = usePlayerCount();
  const isDoublesDesign = useCanvasStore((state) => state.design.doubles);

  const [tempPlayer, setTempPlayer] = useState<PlayerInfo | undefined>(
    players[selectedPlayerIndex],
  );

  const selectedPlayer = useMemo(
    () => players[selectedPlayerIndex],
    [players, selectedPlayerIndex],
  );

  // Which player of the slot's team the fields edit. It is kept from slot to
  // slot, so every team's second player can be filled in one after another.
  const [member, setMember] = useState<TeamMember>("player");

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

  // The second player is offered on a doubles design, and on any design for
  // a slot that already has one (a team loaded from start.gg).
  const showMembers = Boolean(isDoublesDesign || tempPlayer?.teammate);
  const activeMember: TeamMember = showMembers ? member : "player";
  const edited: TeammateInfo | undefined =
    activeMember === "teammate"
      ? (tempPlayer?.teammate ?? BLANK_TEAMMATE)
      : tempPlayer;

  // Writes to whichever player of the team is being edited. A slot gets its
  // teammate the first time one of the second player's fields changes.
  const patch = (fields: Partial<TeammateInfo>) => {
    if (!tempPlayer) return;

    let newPlayer: PlayerInfo;
    if (activeMember === "teammate") {
      const teammate = {
        ...(tempPlayer.teammate ?? BLANK_TEAMMATE),
        ...fields,
      };
      newPlayer = {
        ...tempPlayer,
        teammate: { ...teammate, name: teammate.gamerTag },
      };
    } else {
      newPlayer = { ...tempPlayer, ...fields };
    }

    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    patch({ [e.target.name]: e.target.value } as Partial<TeammateInfo>);

  const handleAssetSelect = (src: string) => patch({ avatarImgSrc: src });
  const handleClear = () => patch({ avatarImgSrc: undefined });
  const handleCharactersChange = (characters: CharacerData[]) =>
    patch({ characters });
  const handleCountryChange = (country: string) => patch({ country });
  const handleCustomFlagSelect = (src: string) => patch({ customFlagSrc: src });
  const handleCustomFlagClear = () => patch({ customFlagSrc: undefined });

  // The placement is the team's, whichever player is being edited.
  const handlePlacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tempPlayer) return;
    const newPlayer: PlayerInfo = {
      ...tempPlayer,
      placement: parseInt(e.target.value, 10) || 0,
    };
    setTempPlayer(newPlayer);
    debouncedUpdatePlayer(newPlayer, selectedPlayerIndex);
  };

  const handleRemoveTeammate = () => {
    if (!tempPlayer) return;
    debouncedUpdatePlayer.cancel();
    const newPlayer: PlayerInfo = { ...tempPlayer, teammate: undefined };
    setTempPlayer(newPlayer);
    setMember("player");
    dispatch({
      type: "UPDATE_PLAYER",
      payload: { index: selectedPlayerIndex, player: newPlayer },
    });
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

  const {
    confirm: confirmRemoveTeammate,
    confirmationDialog: removeTeammateConfirmation,
  } = useConfirmation(handleRemoveTeammate, {
    title: _(msg`Remove Teammate?`),
    description: _(msg`This will remove the second player from this slot.`),
  });

  const disabled = !selectedPlayer;
  const mainCharacter = edited?.characters[0];
  const hasCustomImages = Boolean(
    edited?.avatarImgSrc || edited?.customFlagSrc,
  );
  const memberLabel = (tag: string | undefined, slot: number) => (
    <span className={styles.memberLabel}>{tag || _(msg`Player ${slot}`)}</span>
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
        {showMembers && (
          <RadioGroup<TeamMember>
            className={styles.memberSwitch}
            value={activeMember}
            onChange={setMember}
            options={[
              { value: "player", label: memberLabel(tempPlayer?.gamerTag, 1) },
              {
                value: "teammate",
                label: memberLabel(tempPlayer?.teammate?.gamerTag, 2),
              },
            ]}
          />
        )}
        <div className={styles.nameplate}>
          <div className={styles.portrait} aria-hidden="true">
            {mainCharacter ? (
              <img
                className={styles.portraitImg}
                src={getCharImgUrl({
                  characterId: mainCharacter.id,
                  alt: mainCharacter.alt,
                  type: "main",
                  style: mainCharacter.style,
                })}
                alt=""
                draggable={false}
              />
            ) : (
              <FaUser size={24} />
            )}
            {edited?.country && (
              <img
                className={styles.portraitFlag}
                src={`/assets/flags/${edited.country.toLowerCase()}.svg`}
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
              value={edited?.gamerTag ?? ""}
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
                value={edited?.prefix ?? ""}
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
          key={activeMember}
          characters={edited?.characters ?? []}
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
          value={edited?.twitter ?? ""}
          onChange={handleChange}
          disabled={disabled}
        />
        <FieldGroup label={<Trans>Country</Trans>}>
          <CountryDropDown
            selectedCountry={edited?.country ?? ""}
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
                  selectedSrc={edited?.avatarImgSrc}
                  onSelect={handleAssetSelect}
                  onClear={handleClear}
                  disabled={disabled}
                />
              </FieldGroup>
              <FieldGroup label={<Trans>Custom Flag</Trans>}>
                <AssetSelector
                  selectedSrc={edited?.customFlagSrc}
                  onSelect={handleCustomFlagSelect}
                  onClear={handleCustomFlagClear}
                  disabled={disabled}
                />
              </FieldGroup>
            </FieldRow>
          )}
        </div>
      </EditorCard>

      {activeMember === "teammate" ? (
        <Button
          variant="subtle"
          className={styles.clearPlayer}
          onClick={confirmRemoveTeammate}
          disabled={disabled || !tempPlayer?.teammate}
        >
          <HiOutlineUserRemove /> <Trans>Remove Teammate</Trans>
        </Button>
      ) : (
        <Button
          variant="subtle"
          className={styles.clearPlayer}
          onClick={confirmClearPlayer}
          disabled={disabled}
        >
          <HiOutlineUserRemove /> <Trans>Clear Player</Trans>
        </Button>
      )}
      {clearPlayerConfirmation}
      {removeTeammateConfirmation}
    </EditorPanel>
  );
};
