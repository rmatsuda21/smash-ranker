import { memo, useMemo } from "react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import {
  getCharacter,
  getCharactersForGame,
} from "@/utils/top8/characterCatalog";
import {
  getCharacterDisplayName,
  getCharacterSearchTerms,
} from "@/utils/top8/getCharacterName";
import { DropDownSelect } from "@/components/shared/DropDownSelect/DropDownSelect";
import { CharacerData } from "@/types/top8/Player";
import { GameId } from "@/types/Game";

type Props = {
  selectedCharacter?: CharacerData;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  // Which game's characters to list.
  game: GameId;
};

const CharacterSelectComponent = ({
  selectedCharacter,
  onValueChange,
  disabled = false,
  game,
}: Props) => {
  const { _, i18n } = useLingui();

  const selectedId = selectedCharacter?.id;

  const options = useMemo(() => {
    const locale = i18n.locale;

    const noneOption = {
      id: EMPTY_CHARACTER_ID,
      value: EMPTY_CHARACTER_ID,
      display: _(msg`None`),
      imageSrc: "/favicon.svg",
      searchTerms: ["none", "empty", "なし"],
    };

    const characters = getCharactersForGame(game);
    // A character from another game stays in the list while it is selected,
    // so the field keeps showing it after the game is switched.
    const selected = selectedId ? getCharacter(selectedId) : undefined;
    const listed =
      selected && !characters.includes(selected)
        ? [...characters, selected]
        : characters;

    const characterOptions = listed
      .map((c) => ({
        id: c.id,
        value: c.id,
        display: getCharacterDisplayName(c.id, locale),
        imageSrc: getCharImgUrl({ characterId: c.id, alt: 0, type: "stock" }),
        searchTerms: getCharacterSearchTerms(c.id),
      }))
      .sort((a, b) => a.display.localeCompare(b.display, locale));

    return [noneOption, ...characterOptions];
  }, [_, i18n.locale, game, selectedId]);

  const handleChange = (id: string) => {
    onValueChange(id);
  };

  return (
    <DropDownSelect
      options={options}
      selectedValue={selectedCharacter?.id ?? ""}
      onChange={handleChange}
      disabled={disabled}
      placeholder={_(msg`Select Character`)}
      searchable
    />
  );
};

export const CharacterSelect = memo(
  CharacterSelectComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.selectedCharacter?.id === nextProps.selectedCharacter?.id &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.game === nextProps.game &&
      prevProps.onValueChange === nextProps.onValueChange
    );
  },
);
