import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharacterImage } from "@/utils/top8/generateGraphic";
import { Flex, Select } from "@radix-ui/themes";

export const CharacterSelect = ({
  characterId,
  setCharacterId,
}: {
  characterId: string;
  setCharacterId: (id: string) => void;
}) => {
  return (
    <Select.Root value={characterId} onValueChange={setCharacterId}>
      <Select.Trigger>
        <Flex as="span" align="center" gap="2">
          <img
            style={{ marginRight: 8 }}
            width={24}
            height={24}
            src={getCharacterImage({
              characterId: String(characterId),
              alt: 0,
              type: "stock",
            })}
          />
          {characters.find((c) => c.id === Number(characterId))?.name}
        </Flex>
      </Select.Trigger>
      <Select.Content position="popper">
        {characters.map((character) => (
          <Select.Item key={character.id} value={String(character.id)}>
            <Flex direction={"row"}>
              <img
                style={{ marginRight: 8 }}
                width={24}
                height={24}
                src={getCharacterImage({
                  characterId: String(character.id),
                  alt: 0,
                  type: "stock",
                })}
              />
              {character.name}
            </Flex>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};
