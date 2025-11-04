import { useMemo } from "react";
import Select from "react-dropdown-select";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

type CharacterOption = {
  id: string;
  name: string;
  url: string;
};

type Props = {
  characterId: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

export const CharacterSelect = ({
  characterId,
  onValueChange,
  disabled = false,
}: Props) => {
  const options = useMemo(
    () =>
      characters.map((c) => ({
        id: c.id,
        name: c.name,
        url: getCharImgUrl({ characterId: c.id, alt: 0, type: "stock" }),
      })),
    []
  );

  const selectedCharacter = useMemo(
    () => options.filter((c) => c.id === characterId),
    [characterId, options]
  );

  const handleChange = (values: CharacterOption[]) => {
    if (values.length > 0) {
      onValueChange(String(values[0].id));
    }
  };

  const itemRenderer = ({
    item,
    itemIndex,
    state,
    methods,
  }: {
    item: CharacterOption;
    itemIndex?: number;
    state: any;
    methods: any;
  }) => (
    <div
      onClick={() => methods.addItem(item)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        cursor: "pointer",
        backgroundColor: state.cursor === itemIndex ? "#f0f0f0" : "transparent",
      }}
    >
      <img
        style={{ marginRight: 8 }}
        width={24}
        height={24}
        src={item.url}
        alt={item.name ?? ""}
      />
      {item.name}
    </div>
  );

  const contentRenderer = ({ state }: { state: any }) => {
    if (state.values.length === 0) return null;
    const character = state.values[0];
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          style={{ marginRight: 8 }}
          width={24}
          height={24}
          src={getCharImgUrl({
            characterId: String(character.id),
            alt: 0,
            type: "stock",
          })}
          alt={character.name ?? ""}
        />
        {character.name}
      </div>
    );
  };

  return (
    <Select
      disabled={disabled}
      options={options}
      values={selectedCharacter}
      onChange={handleChange}
      labelField="name"
      valueField="id"
      searchable={true}
      itemRenderer={itemRenderer}
      contentRenderer={contentRenderer}
    />
  );
};
