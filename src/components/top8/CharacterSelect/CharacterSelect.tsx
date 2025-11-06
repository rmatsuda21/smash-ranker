import { useMemo } from "react";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { DropDownSelect } from "../DropDownSelect/DropDownSelect";

type CharacterOption = {
  id: string;
  name: string;
  url: string;
};

type Props = {
  selectedCharacterId: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

export const CharacterSelect = ({
  selectedCharacterId,
  onValueChange,
  disabled = false,
}: Props) => {
  const options = useMemo(
    () =>
      characters.map((c) => ({
        id: c.id,
        name: c.name,
        imageSrc: getCharImgUrl({ characterId: c.id, alt: 0, type: "stock" }),
        value: c.id,
        display: c.name,
      })),
    []
  );

  const selectedCharacter = useMemo(
    () => options.find((c) => c.id === selectedCharacterId) || null,
    [selectedCharacterId, options]
  );

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
    />
  );
};
