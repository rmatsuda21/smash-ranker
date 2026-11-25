import { RenderStyleId } from "@/types/Game";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";
import { noCharacters } from "@/utils/top8/playerCharacters";
import { getRenderSet, resolveRenderAlt } from "@/utils/top8/characterCatalog";

// A character as it should be stored while the graphic uses `style`: tagged
// with the style when it has art there (untagged otherwise, so it keeps its
// standard render), and moved to a costume the style has.
export const withRenderStyle = (
  character: CharacerData,
  style: RenderStyleId,
): CharacerData => {
  const applied = getRenderSet(character.id, style) ? style : undefined;
  const alt = resolveRenderAlt(
    character.id,
    character.alt,
    applied,
  ) as CharacerData["alt"];

  if (character.style === applied && character.alt === alt) return character;

  const next: CharacerData = { id: character.id, alt };
  if (applied) next.style = applied;
  return next;
};

// The same array when no character in it changed. An empty list comes out
// as the "no character" entry, so the store holds one shape for it.
const styleCharacters = (
  characters: CharacerData[],
  style: RenderStyleId,
): CharacerData[] => {
  if (characters.length === 0) return noCharacters();

  const styled = characters.map((character) =>
    withRenderStyle(character, style),
  );
  return styled.every((c, i) => c === characters[i]) ? characters : styled;
};

// Players whose characters did not change keep their identity, so nothing
// that depends on them re-renders.
export const applyRenderStyle = (
  players: PlayerInfo[],
  style: RenderStyleId,
): PlayerInfo[] =>
  players.map((player) => {
    const characters = styleCharacters(player.characters, style);
    const teammate = player.teammate && {
      ...player.teammate,
      characters: styleCharacters(player.teammate.characters, style),
    };
    const teammateChanged =
      teammate && teammate.characters !== player.teammate?.characters;

    if (characters === player.characters && !teammateChanged) return player;
    return {
      ...player,
      characters,
      ...(teammateChanged && { teammate }),
    };
  });
