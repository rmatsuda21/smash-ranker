import { memo } from "react";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { CharacerData } from "@/types/top8/Player";

type Props = {
  selectedCharacter?: CharacerData;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

const characterOptions = new Map(
  characters
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => [
      c.id,
      {
        id: c.id,
        value: c.id,
        name: c.name,
        imageSrc: getCharImgUrl({ characterId: c.id, alt: 0, type: "stock" }),
        display: c.name,
      },
    ])
);

const options = Array.from(characterOptions.values());

const CharacterSelectComponent = ({
  selectedCharacter,
  onValueChange,
  disabled = false,
}: Props) => {
  const handleChange = (id: string) => {
    onValueChange(id);
  };

  return (
    <DropDownSelect
      options={options}
      selectedValue={selectedCharacter?.id ?? ""}
      onChange={handleChange}
      disabled={disabled}
      placeholder="Select Character"
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
