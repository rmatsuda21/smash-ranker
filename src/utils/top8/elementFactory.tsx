import { Group, Rect, Text } from "react-konva";
import { ReactNode } from "react";
import { SceneContext } from "konva/lib/Context";

import {
  ElementConfig,
  TextElementConfig,
  SmartTextElementConfig,
  ImageElementConfig,
  CharacterImageElementConfig,
  AltCharacterImageElementConfig,
  GroupElementConfig,
  RectElementConfig,
  CustomImageElementConfig,
  SvgElementConfig,
} from "@/types/top8/LayoutTypes";
import {
  ElementFactoryContext,
  ElementCreator,
} from "@/types/top8/ElementFactoryTypes";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import { SmartText } from "@/components/top8/SmartText/SmartText";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { CustomSVG } from "@/components/top8/Canvas/CustomSVG";
import { replacePlaceholders } from "@/utils/top8/replacePlaceholderString";

const createTextElement: ElementCreator<TextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial" } = context;
  const text = replacePlaceholders(element.text, context);

  return (
    <Text
      key={`text-${index}`}
      x={element.position.x}
      y={element.position.y}
      fill={element.fill ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={element.fontStyle ?? String(element.fontWeight ?? "normal")}
      fontFamily={fontFamily}
      text={text}
      align={element.align ?? "left"}
      width={element.size?.width}
      shadowColor={element.shadowColor}
      shadowBlur={element.shadowBlur}
      shadowOffset={element.shadowOffset}
      shadowOpacity={element.shadowOpacity}
    />
  );
};

const createSmartTextElement: ElementCreator<SmartTextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial" } = context;
  const text = replacePlaceholders(element.text, context);

  return (
    <SmartText
      key={`smartText-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      fill={element.fill ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={element.fontStyle ?? String(element.fontWeight ?? "normal")}
      fontFamily={fontFamily}
      text={text}
      align={element.align ?? "left"}
      verticalAlign={element.verticalAlign}
      shadowColor={element.shadowColor}
      shadowBlur={element.shadowBlur}
      shadowOffset={element.shadowOffset}
      shadowOpacity={element.shadowOpacity}
    />
  );
};

const createImageElement: ElementCreator<ImageElementConfig> = ({
  element,
  index,
}) => {
  return (
    <CustomImage
      key={`image-${index}`}
      id={`image-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      imageSrc={element.src}
    />
  );
};

const createGroupElement: ElementCreator<GroupElementConfig> = ({
  element,
  index,
}) => {
  return (
    <Group
      key={`group-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
    />
  );
};

const createCharacterImageElement: ElementCreator<
  CharacterImageElementConfig
> = ({ element, index, context }) => {
  const { player } = context;

  if (!player || player.characters.length === 0) {
    return null;
  }

  const mainCharacter = player.characters[0];
  const imageSrc =
    player.customCharImgSrc ??
    getCharImgUrl({
      characterId: mainCharacter.id,
      alt: mainCharacter.alt,
    });

  return (
    <CustomImage
      key={`character-${index}`}
      id="character"
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      imageSrc={imageSrc}
      hasShadow
      shadowColor={element.shadowColor}
      shadowOffset={{ x: 15, y: 15 }}
      shadowBlur={element.shadowBlur}
      shadowOpacity={element.shadowOpacity}
    />
  );
};

const createAltCharacterImageElement: ElementCreator<
  AltCharacterImageElementConfig
> = ({ element, index, context }) => {
  const { player } = context;

  if (!player || player.characters.length <= 1) {
    return null;
  }

  const altCharacters = player.characters.slice(1);
  const size = element.size?.width ?? 50;
  const gap = 5;

  return (
    <Group
      key={`alt-group-${index}`}
      x={element.position.x}
      y={element.position.y}
    >
      {altCharacters.map((character, altIndex) => {
        const imageSrc = getCharImgUrl({
          characterId: character.id,
          alt: character.alt,
          type: "stock",
        });

        return (
          <CustomImage
            key={`alt-${player.id}-${altIndex}`}
            id={`alternate-character-${altIndex}`}
            x={0}
            y={altIndex * (size + gap)}
            width={size}
            height={size}
            imageSrc={imageSrc}
          />
        );
      })}
    </Group>
  );
};

const createRectElement: ElementCreator<RectElementConfig> = ({
  element,
  index,
}) => {
  return (
    <Rect
      key={`rect-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
      fill={element.fill ?? "black"}
    />
  );
};

const createCustomImageElement: ElementCreator<CustomImageElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { containerSize } = context;

  const width = element.size?.width ?? containerSize?.width ?? 100;
  const height = element.size?.height ?? containerSize?.height ?? 100;

  return (
    <CustomImage
      key={`customImage-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={width}
      height={height}
      imageSrc={element.src}
    />
  );
};

const createSvgElement: ElementCreator<SvgElementConfig> = ({
  element,
  index,
}) => {
  return (
    <CustomSVG
      key={`svg-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      src={element.src}
      palette={element.palette}
    />
  );
};

const elementCreators = {
  text: createTextElement,
  smartText: createSmartTextElement,
  image: createImageElement,
  group: createGroupElement,
  characterImage: createCharacterImageElement,
  altCharacterImage: createAltCharacterImageElement,
  rect: createRectElement,
  customImage: createCustomImageElement,
  svg: createSvgElement,
};

export const createKonvaElements = (
  elements: ElementConfig[],
  context: ElementFactoryContext = {}
): ReactNode[] => {
  return elements
    .map((element, index) => {
      if (!(element.type in elementCreators)) {
        return null;
      }

      const creator = elementCreators[element.type] as ElementCreator<
        typeof element
      >;

      const el = creator({ element, index, context });
      const size = context.containerSize ?? { width: 100, height: 100 };
      const clipFunc = (ctx: SceneContext) => {
        ctx.beginPath();
        ctx.rect(0, 0, size.width, size.height);
        ctx.closePath();
      };

      return (
        <Group
          id={element.id}
          draggable={context.options?.editable ?? false}
          key={`group-${index}`}
          clipFunc={element.clip ? clipFunc : undefined}
        >
          {el}
        </Group>
      );
    })
    .filter(Boolean);
};
