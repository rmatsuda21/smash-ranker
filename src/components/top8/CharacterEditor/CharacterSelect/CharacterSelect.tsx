import { memo } from "react";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { CharacerData } from "@/types/top8/PlayerTypes";

type CharacterOption = {
  id: string;
  name: string;
  imageSrc: string;
  value: string;
  display: string;
};

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
        name: c.name,
        imageSrc: getCharImgUrl({ characterId: c.id, alt: 0, type: "stock" }),
        value: c.id,
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
  const handleChange = (values: CharacterOption[]) => {
    if (values.length > 0) {
      onValueChange(String(values[0].id));
    }
  };

  return (
    <DropDownSelect
      options={options}
      selectedValue={selectedCharacter?.id}
      onChange={handleChange}
      disabled={disabled}
      placeholder="Select Character"
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
