import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { DropDownSelect } from "../DropDownSelect/DropDownSelect";

type CharacterOption = {
  id: string;
  name: string;
  imageSrc: string;
  value: string;
  display: string;
};

type Props = {
  selectedCharacterId: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

const characterOptions = new Map(
  characters.map((c) => [
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

export const CharacterSelect = ({
  selectedCharacterId,
  onValueChange,
  disabled = false,
}: Props) => {
  const selectedCharacter = characterOptions.get(selectedCharacterId);

  const handleChange = (values: CharacterOption[]) => {
    if (values.length > 0) {
      onValueChange(String(values[0].id));
    }
  };

  return (
    <DropDownSelect
      options={Array.from(characterOptions.values())}
      selectedValue={selectedCharacter?.value}
      onChange={handleChange}
      disabled={disabled}
    />
  );
};
