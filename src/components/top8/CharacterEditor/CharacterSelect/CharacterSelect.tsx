import { memo, useMemo } from "react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { characters } from "@/consts/top8/ultCharacters.json";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import {
  getCharacterDisplayName,
  getCharacterSearchTerms,
} from "@/utils/top8/getCharacterName";
import { DropDownSelect } from "@/components/shared/DropDownSelect/DropDownSelect";
import { CharacerData } from "@/types/top8/Player";

type Props = {
  selectedCharacter?: CharacerData;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

const CharacterSelectComponent = ({
  selectedCharacter,
  onValueChange,
  disabled = false,
}: Props) => {
  const { _, i18n } = useLingui();

  const options = useMemo(() => {
    const locale = i18n.locale;

    const noneOption = {
      id: EMPTY_CHARACTER_ID,
      value: EMPTY_CHARACTER_ID,
      display: _(msg`None`),
      imageSrc: "/favicon.svg",
      searchTerms: ["none", "empty", "なし"],
    };

    const characterOptions = characters
      .map((c) => ({
        id: c.id,
        value: c.id,
        display: getCharacterDisplayName(c.id, locale),
        imageSrc: getCharImgUrl({ characterId: c.id, alt: 0, type: "stock" }),
        searchTerms: getCharacterSearchTerms(c.id),
      }))
      .sort((a, b) => a.display.localeCompare(b.display, locale));

    return [noneOption, ...characterOptions];
  }, [_, i18n.locale]);

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
      prevProps.onValueChange === nextProps.onValueChange
    );
  }
);
