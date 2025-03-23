import { characters } from "@/consts/top8/ultCharacters.json";
import { Flex, Select } from "@radix-ui/themes";

export const CharacterSelect = ({
  characterId,
  setCharacterId,
}: {
  characterId: string;
  setCharacterId: (id: string) => void;
}) => {
  console.log(characters);

  return (
    <Select.Root value={characterId} onValueChange={setCharacterId}>
      <Select.Trigger>
        <Flex as="span" align="center" gap="2">
          {characterId}
        </Flex>
      </Select.Trigger>
      <Select.Content position="popper">
        <Select.Item value="1766">Light</Select.Item>
        <Select.Item value="1777">Dark</Select.Item>
      </Select.Content>
    </Select.Root>
  );
};
