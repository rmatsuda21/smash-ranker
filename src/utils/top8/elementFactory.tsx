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
  FlexGroupElementConfig,
  RectElementConfig,
  CustomImageElementConfig,
  SvgElementConfig,
  TournamentIconElementConfig,
  BackgroundImageElementConfig,
  UserFlagElementConfig,
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

export interface CreateKonvaElementsOptions {
  onAllReady?: () => void;
  onError?: (error: Error) => void;
  perfectDraw?: boolean;
}

interface AsyncLoadTracker {
  expected: number;
  loaded: number;
  hasErrored: boolean;
  onAllReady?: () => void;
  onError?: (error: Error) => void;
}

type InternalContext = ElementFactoryContext & {
  _asyncTracker?: AsyncLoadTracker;
};

const ASYNC_ELEMENT_TYPES = new Set([
  "image",
  "characterImage",
  "altCharacterImage",
  "customImage",
  "svg",
  "tournamentIcon",
  "backgroundImage",
  "userFlag",
]);

const createTextElement: ElementCreator<TextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial", design } = context;
  const resolvedText = resolveText(
    element.textId,
    element.text,
    design?.textPalette
  );
  const text = replacePlaceholders(resolvedText, context);

  return (
    <Text
      key={element.id ?? `text-${index}`}
      x={element.position.x}
      y={element.position.y}
      fill={resolveColor(element.fill, design?.colorPalette) ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={element.fontStyle ?? String(element.fontWeight ?? "normal")}
      fontFamily={fontFamily}
      text={text}
      align={element.align ?? "left"}
      verticalAlign={element.verticalAlign ?? "top"}
      width={element.size?.width}
      height={element.size?.height}
      wrap="word"
      shadowColor={resolveColor(element.shadowColor, design?.colorPalette)}
      shadowBlur={element.shadowBlur}
      shadowOffset={element.shadowOffset}
      shadowOpacity={element.shadowOpacity}
      stroke={resolveColor(
        element.stroke as string | undefined,
        design?.colorPalette
      )}
      strokeWidth={element.strokeWidth}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

const createSmartTextElement: ElementCreator<SmartTextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial", design } = context;
  const resolvedText = resolveText(
    element.textId,
    element.text,
    design?.textPalette
  );
  const text = replacePlaceholders(resolvedText, context);

  return (
    <SmartText
      key={element.id ?? `smartText-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
      fill={resolveColor(element.fill, design?.colorPalette) ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={element.fontStyle ?? String(element.fontWeight ?? "normal")}
      fontFamily={fontFamily}
      text={text}
      align={element.align ?? "left"}
      verticalAlign={element.verticalAlign}
      anchor={element.anchor}
      shadowColor={resolveColor(element.shadowColor, design?.colorPalette)}
      shadowBlur={element.shadowBlur}
      shadowOffset={element.shadowOffset}
      shadowOpacity={element.shadowOpacity}
      stroke={resolveColor(
        element.stroke as string | undefined,
        design?.colorPalette
      )}
      strokeWidth={element.strokeWidth}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

const createImageElement: ElementCreator<ImageElementConfig> = ({
  element,
  index,
}) => {
  return (
    <CustomImage
      key={element.id ?? `image-${index}`}
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
  const konvaElements = createKonvaElementsInternal(element.elements, context);

  return (
    <Group
      key={element.id ?? `group-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
    >
      {konvaElements}
    </Group>
  );
};

interface FlexChildInfo {
  element: ElementConfig;
  originalIndex: number;
  mainSize: number;
  crossSize: number;
  isFlexible: boolean;
  flexGrow: boolean;
  flexShrink: boolean;
}

const getElementMainSize = (
  element: ElementConfig,
  direction: "row" | "column"
): number => {
  const basis = element.flex?.basis;
  if (basis !== undefined) return basis;

  if (direction === "row") {
    return element.size?.width ?? 0;
  }

  if (element.size?.height === undefined) {
    if (element.type === "text" || element.type === "smartText") {
      const textEl = element as TextElementConfig | SmartTextElementConfig;
      return textEl.fontSize ?? 20;
    }
  }

  return element.size?.height ?? 0;
};

const getElementCrossSize = (
  element: ElementConfig,
  direction: "row" | "column"
): number => {
  if (direction === "row") {
    if (element.size?.height === undefined) {
      if (element.type === "text" || element.type === "smartText") {
        const textEl = element as TextElementConfig | SmartTextElementConfig;
        return textEl.fontSize ?? 20;
      }
    }
    return element.size?.height ?? 0;
  }
  return element.size?.width ?? 0;
};

const createFlexGroupElement: ElementCreator<FlexGroupElementConfig> = ({
  element,
  index,
  context,
}) => {
  const direction = element.direction ?? "row";
  const gap = element.gap ?? 0;
  const align = element.align ?? "start";
  const justify = element.justify ?? "start";

  const containerMainSize =
    direction === "row" ? element.size?.width ?? 0 : element.size?.height ?? 0;
  const containerCrossSize =
    direction === "row" ? element.size?.height ?? 0 : element.size?.width ?? 0;

  const visibleChildren: FlexChildInfo[] = [];

  for (let i = 0; i < element.elements.length; i++) {
    const child = element.elements[i];

    if (child.hidden || !evaluateElementCondition(child.conditions, context)) {
      continue;
    }

    const isFlexible = !!(child.flex?.grow || child.flex?.shrink);

    visibleChildren.push({
      element: child,
      originalIndex: i,
      mainSize: getElementMainSize(child, direction),
      crossSize: getElementCrossSize(child, direction),
      isFlexible,
      flexGrow: !!child.flex?.grow,
      flexShrink: !!child.flex?.shrink,
    });
  }

  if (visibleChildren.length === 0) {
    return (
      <Group
        key={element.id ?? `flexGroup-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width}
        height={element.size?.height}
      />
    );
  }

  const totalGaps = gap * (visibleChildren.length - 1);
  const totalDefinedSize = visibleChildren.reduce(
    (sum, child) => sum + child.mainSize,
    0
  );
  const remainingSpace = containerMainSize - totalDefinedSize - totalGaps;

  let growCount = 0;
  let shrinkCount = 0;
  let shrinkableSize = 0;

  for (const child of visibleChildren) {
    if (child.flexGrow) growCount++;
    if (child.flexShrink) {
      shrinkCount++;
      shrinkableSize += child.mainSize;
    }
  }

  if (remainingSpace > 0 && growCount > 0) {
    const extraPerElement = remainingSpace / growCount;
    for (const child of visibleChildren) {
      if (child.flexGrow) {
        child.mainSize += extraPerElement;
      }
    }
  } else if (remainingSpace < 0 && shrinkCount > 0) {
    const shrinkAmount = Math.min(Math.abs(remainingSpace), shrinkableSize);
    for (const child of visibleChildren) {
      if (child.flexShrink && shrinkableSize > 0) {
        const ratio = child.mainSize / shrinkableSize;
        child.mainSize = Math.max(0, child.mainSize - shrinkAmount * ratio);
      }
    }
  }

  const totalContentSize = visibleChildren.reduce(
    (sum, child) => sum + child.mainSize,
    0
  );

  let mainOffset = 0;
  let spaceBetween = 0;

  switch (justify) {
    case "center":
      mainOffset = (containerMainSize - totalContentSize - totalGaps) / 2;
      break;
    case "end":
      mainOffset = containerMainSize - totalContentSize - totalGaps;
      break;
    case "space-between":
      if (visibleChildren.length > 1) {
        spaceBetween =
          (containerMainSize - totalContentSize) / (visibleChildren.length - 1);
      }
      break;
    case "start":
    default:
      mainOffset = 0;
      break;
  }

  const positionedElements: ReactNode[] = [];
  let currentMainPosition = mainOffset;

  for (const child of visibleChildren) {
    let crossPosition = 0;
    switch (align) {
      case "center":
        crossPosition = (containerCrossSize - child.crossSize) / 2;
        break;
      case "end":
        crossPosition = containerCrossSize - child.crossSize;
        break;
      case "start":
      default:
        crossPosition = 0;
        break;
    }

    const modifiedElement: ElementConfig = {
      ...child.element,
      position: {
        x: direction === "row" ? currentMainPosition : crossPosition,
        y: direction === "row" ? crossPosition : currentMainPosition,
      },
      size: {
        ...child.element.size,
        ...(direction === "row"
          ? { width: child.mainSize }
          : { height: child.mainSize }),
      },
    };

    const createdElements = createKonvaElementsInternal(
      [modifiedElement],
      context
    );
    positionedElements.push(...createdElements);

    currentMainPosition +=
      child.mainSize + (justify === "space-between" ? spaceBetween : gap);
  }

  return (
    <Group
      key={element.id ?? `flexGroup-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
    >
      {positionedElements}
    </Group>
  );
};

const createCharacterImageElement: ElementCreator<
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
      key={element.id ?? `alt-group-${index}`}
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
            perfectDrawEnabled={context.perfectDraw}
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
  const { design } = context;

  return (
    <Rect
      key={element.id ?? `rect-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
      fill={resolveColor(element.fill, design?.colorPalette) ?? "black"}
      perfectDrawEnabled={context.perfectDraw}
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
      key={element.id ?? `customImage-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={width}
      height={height}
      imageSrc={element.src}
      fillMode={element.fillMode ?? "contain"}
      align={element.align ?? "center"}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

const createSvgElement: ElementCreator<SvgElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { design } = context;

  const resolvedPalette = resolvePaletteColors(
    element.palette,
    design?.colorPalette
  );

  return (
    <CustomSVG
      key={element.id ?? `svg-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      src={element.src}
      palette={resolvedPalette}
      perfectDrawEnabled={context.perfectDraw}
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
        key={element.id ?? `tournamentIcon-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width ?? 100}
        height={element.size?.height ?? 100}
        fill="#000000"
        perfectDrawEnabled={context.perfectDraw}
      />
    );
  }

  return (
    <CustomImage
      key={element.id ?? `tournamentIcon-${index}`}
      x={element.position.x}
      y={element.position.y}
      imageSrc={tournament.iconSrc}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      fillMode={element.fillMode ?? "contain"}
      align={element.align ?? "center"}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

const createBackgroundImageElement: ElementCreator<
  BackgroundImageElementConfig
> = ({ element, index, context }) => {
  const backgroundImgId = context.design?.bgAssetId ?? "";

  if (!backgroundImgId) {
    return null;
  }

  return (
    <CustomImage
      key={element.id ?? `backgroundImage-${index}`}
      imageSrc={backgroundImgId}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      fillMode={element.fillMode ?? "contain"}
      align={element.align ?? "center"}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

const createUserFlagElement: ElementCreator<UserFlagElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { player } = context;

  if (!player?.country) {
    return null;
  }

  const countryCode = player.country.toLowerCase();
  const flagSrc = `/assets/flags/${countryCode}.svg`;

  return (
    <CustomImage
      key={element.id ?? `userFlag-${index}`}
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

const elementCreators = {
  text: createTextElement,
  smartText: createSmartTextElement,
  image: createImageElement,
  group: createGroupElement,
  flexGroup: createFlexGroupElement,
  characterImage: createCharacterImageElement,
  altCharacterImage: createAltCharacterImageElement,
  rect: createRectElement,
  customImage: createCustomImageElement,
  svg: createSvgElement,
  tournamentIcon: createTournamentIconElement,
  backgroundImage: createBackgroundImageElement,
  userFlag: createUserFlagElement,
};

const countAsyncElements = (
  elements: ElementConfig[],
  context: ElementFactoryContext
): number => {
  let count = 0;

  for (const element of elements) {
    if (!(element.type in elementCreators)) continue;

    const shouldRender =
      !element.hidden && evaluateElementCondition(element.conditions, context);

    if (!shouldRender) continue;

    if (element.type === "group") {
      count += countAsyncElements(
        (element as GroupElementConfig).elements,
        context
      );
    } else if (element.type === "flexGroup") {
      count += countAsyncElements(
        (element as FlexGroupElementConfig).elements,
        context
      );
    } else if (element.type === "altCharacterImage") {
      const player = context.player;
      if (player && player.characters.length > 1) {
        count += player.characters.length - 1;
      }
    } else if (element.type === "characterImage") {
      const player = context.player;
      if (player && player.characters.length > 0) {
        count += 1;
      }
    } else if (element.type === "tournamentIcon") {
      if (context.tournament?.iconSrc) {
        count += 1;
      }
    } else if (element.type === "backgroundImage") {
      if (context.design?.bgAssetId) {
        count += 1;
      }
    } else if (element.type === "userFlag") {
      if (context.player?.country) {
        count += 1;
      }
    } else if (ASYNC_ELEMENT_TYPES.has(element.type)) {
      count += 1;
    }
  }

  return count;
};

const injectAsyncCallbacks = (
  node: ReactNode,
  tracker: AsyncLoadTracker
): ReactNode => {
  if (!isValidElement(node)) return node;

  const handleReady = () => {
    tracker.loaded += 1;
    if (tracker.loaded === tracker.expected && !tracker.hasErrored) {
      tracker.onAllReady?.();
    }
  };

  const handleError = (error: Error) => {
    if (!tracker.hasErrored) {
      tracker.hasErrored = true;
      tracker.onError?.(error);
    }
  };

  const elementType = node.type;
  if (elementType === CustomImage || elementType === CustomSVG) {
    return cloneElement(
      node as ReactElement<{
        onReady?: () => void;
        onError?: (e: Error) => void;
      }>,
      {
        onReady: handleReady,
        onError: handleError,
      }
    );
  }

  if (elementType === Group) {
    const groupElement = node as ReactElement<{ children?: ReactNode }>;
    const children = groupElement.props.children;

    if (children) {
      const processedChildren = Array.isArray(children)
        ? children.map((child) => injectAsyncCallbacks(child, tracker))
        : injectAsyncCallbacks(children, tracker);

      return cloneElement(groupElement, { children: processedChildren });
    }
  }

  return node;
};

const createKonvaElementsInternal = (
  elements: ElementConfig[],
  context: InternalContext
): ReactNode[] => {
  const result: ReactNode[] = [];
  const containerSize = context.containerSize ?? { width: 100, height: 100 };
  const disableSelectable = context.options?.disableSelectable;
  const isEditable = context.options?.editable ?? false;

  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];

    if (!(element.type in elementCreators)) {
      continue;
    }

    if (
      element.hidden ||
      !evaluateElementCondition(element.conditions, context)
    ) {
      continue;
    }

    const creator = elementCreators[element.type] as ElementCreator<
      typeof element
    >;
    let createdEl = creator({ element, index, context });

    if (!createdEl) {
      continue;
    }

    if (context._asyncTracker) {
      createdEl = injectAsyncCallbacks(createdEl, context._asyncTracker);
    }

    const clipFunc = element.clip
      ? (ctx: SceneContext) => {
          ctx.beginPath();
          ctx.rect(0, 0, containerSize.width, containerSize.height);
          ctx.closePath();
        }
      : undefined;

    const hasFilters =
      element.filterEffects && element.filterEffects.length > 0;

    if (element.selectable && !disableSelectable) {
      const resetEl = isValidElement(createdEl)
        ? cloneElement(
            createdEl as ReactElement<{
              x?: number;
              y?: number;
              listening?: boolean;
            }>,
            { x: 0, y: 0, listening: false }
          )
        : createdEl;

      const childContent = hasFilters ? (
        <FilteredElement filtersConfig={element.filterEffects}>
          {resetEl}
        </FilteredElement>
      ) : (
        resetEl
      );

      result.push(
        <SelectableElement
          key={element.id ?? `selectable-${index}`}
          x={element.position.x}
          y={element.position.y}
          draggable={false}
          onClick={() => context.onElementSelect?.()}
          width={element.size?.width}
          height={element.size?.height}
          scaleX={element.scale?.x}
          scaleY={element.scale?.y}
          rotation={element.rotation ?? 0}
          clipFunc={clipFunc}
          listening={true}
          name={element.name ?? `element-${index}`}
        >
          {childContent}
        </SelectableElement>
      );
    } else {
      const isContainer =
        element.type === "group" || element.type === "flexGroup";

      if (hasFilters) {
        const el = isValidElement(createdEl)
          ? cloneElement(createdEl as ReactElement<{ listening?: boolean }>, {
              listening: isContainer,
            })
          : createdEl;

        result.push(
          <FilteredElement
            draggable={isEditable}
            key={element.id ?? `filtered-${index}`}
            clipFunc={clipFunc}
            listening={isContainer}
            filtersConfig={element.filterEffects}
          >
            {el}
          </FilteredElement>
        );
      } else {
        const el = isValidElement(createdEl)
          ? cloneElement(createdEl as ReactElement<{ listening?: boolean }>, {
              listening: isContainer,
            })
          : createdEl;

        if (clipFunc) {
          result.push(
            <Group
              key={element.id ?? `group-${index}`}
              clipFunc={clipFunc}
              listening={isContainer}
              draggable={isEditable}
            >
              {el}
            </Group>
          );
        } else {
          result.push(el);
        }
      }
    }
  }

  return result;
};

export const createKonvaElements = (
  elements: ElementConfig[],
  context: ElementFactoryContext = {},
  options?: CreateKonvaElementsOptions
): ReactNode[] => {
  if (!options?.onAllReady && !options?.onError) {
    return createKonvaElementsInternal(elements, context);
  }

  const expectedCount = countAsyncElements(elements, context);

  if (expectedCount === 0) {
    if (typeof options.onAllReady === "function") {
      queueMicrotask(options.onAllReady);
    }
    return createKonvaElementsInternal(elements, context);
  }

  const tracker: AsyncLoadTracker = {
    expected: expectedCount,
    loaded: 0,
    hasErrored: false,
    onAllReady: options.onAllReady,
    onError: options.onError,
  };

  const internalContext: InternalContext = {
    ...context,
    _asyncTracker: tracker,
  };

  return createKonvaElementsInternal(elements, internalContext);
};
