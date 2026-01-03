import { Group, Rect, Text } from "react-konva";
import { cloneElement, isValidElement, ReactElement, ReactNode } from "react";
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
  TournamentIconElementConfig,
  BackgroundImageElementConfig,
} from "@/types/top8/Design";
import {
  ElementFactoryContext,
  ElementCreator,
} from "@/types/top8/ElementFactory";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import { SmartText } from "@/components/top8/SmartText/SmartText";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { getCharacterCrop } from "@/utils/top8/getCharacterCrop";
import { CustomSVG } from "@/components/top8/Canvas/CustomSVG";
import { replacePlaceholders } from "@/utils/top8/replacePlaceholderString";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";
import { resolveColor, resolvePaletteColors } from "@/utils/top8/resolveColor";
import { resolveText } from "@/utils/top8/resolveText";
import { SelectableElement } from "@/components/top8/Canvas/SelectableElement";
import { FilteredElement } from "@/components/top8/Canvas/FilteredElement";

const createTextElement: ElementCreator<TextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial", canvas } = context;
  const resolvedText = resolveText(
    element.textId,
    element.text,
    canvas?.textPalette
  );
  const text = replacePlaceholders(resolvedText, context);

  return (
    <Text
      key={`text-${index}`}
      x={element.position.x}
      y={element.position.y}
      fill={resolveColor(element.fill, canvas?.colorPalette) ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={element.fontStyle ?? String(element.fontWeight ?? "normal")}
      fontFamily={fontFamily}
      text={text}
      align={element.align ?? "left"}
      width={element.size?.width}
      shadowColor={resolveColor(element.shadowColor, canvas?.colorPalette)}
      shadowBlur={element.shadowBlur}
      shadowOffset={element.shadowOffset}
      shadowOpacity={element.shadowOpacity}
      stroke={resolveColor(
        element.stroke as string | undefined,
        canvas?.colorPalette
      )}
      strokeWidth={element.strokeWidth}
    />
  );
};

const createSmartTextElement: ElementCreator<SmartTextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial", canvas } = context;
  const resolvedText = resolveText(
    element.textId,
    element.text,
    canvas?.textPalette
  );
  const text = replacePlaceholders(resolvedText, context);

  return (
    <SmartText
      key={`smartText-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      fill={resolveColor(element.fill, canvas?.colorPalette) ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={element.fontStyle ?? String(element.fontWeight ?? "normal")}
      fontFamily={fontFamily}
      text={text}
      align={element.align ?? "left"}
      verticalAlign={element.verticalAlign}
      anchor={element.anchor}
      shadowColor={resolveColor(element.shadowColor, canvas?.colorPalette)}
      shadowBlur={element.shadowBlur}
      shadowOffset={element.shadowOffset}
      shadowOpacity={element.shadowOpacity}
      stroke={resolveColor(
        element.stroke as string | undefined,
        canvas?.colorPalette
      )}
      strokeWidth={element.strokeWidth}
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
  context,
}) => {
  const konvaElements = createKonvaElements(element.elements, context);

  return (
    <Group
      key={`group-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
    >
      {konvaElements}
    </Group>
  );
};

const createCharacterImageElement: ElementCreator<
  CharacterImageElementConfig
> = ({ element, index, context }) => {
  const { player, canvas } = context;

  if (!player || player.characters.length === 0) {
    return (
      <Rect
        key={`character-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width ?? 100}
        height={element.size?.height ?? 100}
        fill="#000000"
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
      key={`character-${index}`}
      id="character"
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      imageSrc={imageSrc}
      cropOffset={cropOffset}
      cropScale={cropScale}
      hasShadow
      shadowColor={resolveColor(element.shadowColor, canvas?.colorPalette)}
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
  context,
}) => {
  const { canvas } = context;

  return (
    <Rect
      key={`rect-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
      fill={resolveColor(element.fill, canvas?.colorPalette) ?? "black"}
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
      fillMode={element.fillMode ?? "contain"}
      align={element.align ?? "center"}
    />
  );
};

const createSvgElement: ElementCreator<SvgElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { canvas } = context;

  const resolvedPalette = resolvePaletteColors(
    element.palette,
    canvas?.colorPalette
  );

  return (
    <CustomSVG
      key={`svg-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      src={element.src}
      palette={resolvedPalette}
    />
  );
};

const createTournamentIconElement: ElementCreator<
  TournamentIconElementConfig
> = ({ element, index, context }) => {
  const { tournament } = context;

  if (!tournament?.iconSrc) {
    return (
      <Rect
        key={`tournamentIcon-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width ?? 100}
        height={element.size?.height ?? 100}
        fill="#000000"
      />
    );
  }

  return (
    <CustomImage
      key={`tournamentIcon-${index}`}
      x={element.position.x}
      y={element.position.y}
      imageSrc={tournament.iconSrc}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      fillMode={element.fillMode ?? "contain"}
      align={element.align ?? "center"}
    />
  );
};

const createBackgroundImageElement: ElementCreator<
  BackgroundImageElementConfig
> = ({ element, index, context }) => {
  const backgroundImgId = context.canvas?.bgAssetId ?? "";

  if (!backgroundImgId) {
    return null;
  }

  return (
    <CustomImage
      key={`backgroundImage-${index}`}
      imageSrc={backgroundImgId}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      fillMode={element.fillMode ?? "contain"}
      align={element.align ?? "center"}
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
  tournamentIcon: createTournamentIconElement,
  backgroundImage: createBackgroundImageElement,
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

      const shouldRender =
        !element.hidden &&
        evaluateElementCondition(element.conditions, context);

      if (!shouldRender) {
        return null;
      }

      const creator = elementCreators[element.type] as ElementCreator<
        typeof element
      >;

      const createdEl = creator({ element, index, context });
      const el =
        isValidElement(createdEl) && createdEl
          ? cloneElement(createdEl as ReactElement<{ listening?: boolean }>, {
              listening: false,
            })
          : createdEl;

      const size = context.containerSize ?? { width: 100, height: 100 };
      const clipFunc = (ctx: SceneContext) => {
        ctx.beginPath();
        ctx.rect(0, 0, size.width, size.height);
        ctx.closePath();
      };

      if (element.selectable) {
        const resetPositionEl =
          isValidElement(el) && el
            ? cloneElement(el as ReactElement<{ x?: number; y?: number }>, {
                x: 0,
                y: 0,
              })
            : el;

        return (
          <SelectableElement
            key={`selectable-${index}`}
            x={element.position.x}
            y={element.position.y}
            draggable={false}
            onClick={() => context.onElementSelect?.()}
            isSelected={false}
            width={element.size?.width}
            height={element.size?.height}
            scaleX={element.scale?.x}
            scaleY={element.scale?.y}
            rotation={element.rotation ?? 0}
            clipFunc={element.clip ? clipFunc : undefined}
            listening={true}
            name={element.name ?? `element-${index}`}
          >
            <FilteredElement filtersConfig={element.filterEffects}>
              {resetPositionEl}
            </FilteredElement>
          </SelectableElement>
        );
      }

      return (
        <FilteredElement
          draggable={context.options?.editable ?? false}
          key={`group-${index}`}
          clipFunc={element.clip ? clipFunc : undefined}
          listening={false}
          filtersConfig={element.filterEffects}
        >
          {el}
        </FilteredElement>
      );
    })
    .filter(Boolean);
};
