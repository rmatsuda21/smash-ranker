import { Group, Rect } from "react-konva";

import type {
  CharacterImageElementConfig,
  AltCharacterImageElementConfig,
  PlayerFlagElementConfig,
  ImageElementConfig,
  FlexGroupElementConfig,
} from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { getCharacterCrop } from "@/utils/top8/getCharacterCrop";
import { resolveColor } from "@/utils/top8/resolveColor";
import { createFlexGroupElement } from "./layout";

export const createCharacterImageElement: ElementCreator<
  CharacterImageElementConfig
> = ({ element, index, context }) => {
  const { player, design } = context;

  if (!player || player.characters.length === 0) {
    return (
      <Rect
        key={element.id ?? `character-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width ?? 100}
        height={element.size?.height ?? 100}
        fill="#000000"
        perfectDrawEnabled={context.perfectDraw}
      />
    );
  }

  const mainCharacter = player.characters[0];
  let imageSrc = getCharImgUrl({
    characterId: mainCharacter.id,
    alt: mainCharacter.alt,
  });

  const characterCrop = getCharacterCrop(mainCharacter.id);
  let cropOffset = characterCrop.offset;
  let cropScale = characterCrop.scale;

  if (context.player?.avatarImgSrc) {
    imageSrc = context.player.avatarImgSrc;
    cropOffset = { x: 0, y: 0 };
    cropScale = 1;
  }

  return (
    <CustomImage
      key={element.id ?? `character-${index}`}
      id="character"
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      imageSrc={imageSrc}
      cropOffset={cropOffset}
      cropScale={cropScale}
      hasShadow={element.shadowEnabled ?? true}
      shadowColor={resolveColor(element.shadowColor, design?.colorPalette)}
      shadowOffset={{ x: 15, y: 15 }}
      shadowBlur={element.shadowBlur}
      shadowOpacity={element.shadowOpacity}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

export const createAltCharacterImageElement: ElementCreator<
  AltCharacterImageElementConfig
> = ({ element, index, context }) => {
  const { player } = context;

  if (!player || player.characters.length <= 1) {
    return null;
  }

  const altCharacters = player.characters.slice(1);
  const gap = element.gap ?? 5;
  const direction = element.direction ?? "column";
  const wrap = element.wrap ?? false;
  const wrapDirection = element.wrapDirection ?? "start";

  const containerWidth = element.size?.width ?? 0;
  const containerHeight = element.size?.height ?? 0;

  // Determine character size based on wrap mode and direction
  let characterSize: number;

  if (wrap) {
    // When wrapping is enabled, use the cross-axis size to determine character size
    // This keeps characters square and allows them to wrap naturally
    const crossSize = direction === "row" ? containerHeight : containerWidth;
    characterSize = crossSize > 0 ? crossSize : 40;
  } else {
    // When not wrapping, calculate size to fit all characters in available space
    const mainSize = direction === "row" ? containerWidth : containerHeight;
    const crossSize = direction === "row" ? containerHeight : containerWidth;
    const totalGaps = gap * Math.max(0, altCharacters.length - 1);
    const availableSpace = Math.max(0, mainSize - totalGaps);

    // Divide available space by number of characters, but don't exceed cross size
    characterSize = availableSpace / altCharacters.length;
    if (crossSize > 0) {
      characterSize = Math.min(characterSize, crossSize);
    }
  }

  // Ensure minimum size
  characterSize = Math.max(10, characterSize);

  const characterImageElements: ImageElementConfig[] = altCharacters.map(
    (character, altIndex) => {
      const imageSrc = getCharImgUrl({
        characterId: character.id,
        alt: character.alt,
        type: "stock",
      });

      return {
        type: "image",
        id: `alt-character-${altIndex}`,
        position: { x: 0, y: 0 },
        size: { width: characterSize, height: characterSize },
        src: imageSrc,
      };
    }
  );

  const flexGroupElement: FlexGroupElementConfig = {
    type: "flexGroup",
    id: element.id ?? `alt-flexGroup-${index}`,
    position: { x: 0, y: 0 },
    size: element.size,
    elements: characterImageElements,
    direction,
    gap,
    align: element.align ?? "start",
    justify: element.justify ?? "start",
    wrap,
    wrapDirection,
  };

  const flexGroup = createFlexGroupElement({
    element: flexGroupElement,
    index,
    context,
  });

  return (
    <Group
      key={element.id ?? `alt-group-${index}`}
      x={element.position.x}
      y={element.position.y}
    >
      {flexGroup}
    </Group>
  );
};

export const createPlayerFlagElement: ElementCreator<
  PlayerFlagElementConfig
> = ({ element, index, context }) => {
  const { player } = context;

  if (!player?.country) {
    return null;
  }

  const countryCode = player.country.toLowerCase();
  const flagSrc = `/assets/flags/${countryCode}.svg`;

  return (
    <CustomImage
      key={element.id ?? `playerFlag-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 40}
      height={element.size?.height ?? 30}
      imageSrc={flagSrc}
      fillMode={element.fillMode ?? "contain"}
      align={element.align ?? "center"}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};
