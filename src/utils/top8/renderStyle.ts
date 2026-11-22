import { RenderStyleId } from "@/types/Game";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";
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

// Players whose characters did not change keep their identity, so nothing
// that depends on them re-renders.
export const applyRenderStyle = (
  players: PlayerInfo[],
  style: RenderStyleId,
): PlayerInfo[] =>
  players.map((player) => {
    const characters = player.characters.map((character) =>
      withRenderStyle(character, style),
    );
    return characters.every((c, i) => c === player.characters[i])
      ? player
      : { ...player, characters };
  });
