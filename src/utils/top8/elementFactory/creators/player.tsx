import { Group, Rect } from "react-konva";

import type {
  CharacterImageElementConfig,
  AltCharacterImageElementConfig,
  CustomAltCharacterImageElementConfig,
  PlayerFlagElementConfig,
  ImageElementConfig,
  FlexGridElementConfig,
  ElementConfig,
  GroupElementConfig,
} from "@/types/top8/Design";
import type { CharacerData } from "@/types/top8/Player";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import {
  EMPTY_CHARACTER_ID,
  EMPTY_CHARACTER_DARK_IMG,
} from "@/consts/top8/characters";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { getCharacterCrop } from "@/utils/top8/getCharacterCrop";
import { resolveColor } from "@/utils/top8/resolveColor";
import { createFlexGridElement } from "./layout";
import {
  calculateGridAlignOffset,
  findOptimalSquareGrid,
  fitColumnStacks,
  placeGridCells,
} from "../layout/gridLayout";
import { getElementKey } from "../elementKey";

export const createCharacterImageElement: ElementCreator<
  CharacterImageElementConfig
> = ({ element, index, context }) => {
  const { player, design } = context;

  if (!player || player.characters.length === 0) {
    return (
      <Rect
        key={getElementKey(element, index)}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width ?? 100}
        height={element.size?.height ?? 100}
        fill="#000000"
        perfectDrawEnabled={context.perfectDraw}
      />
    );
  }

  const character = player.characters[0];
  const characterCrop = getCharacterCrop(
    character.id,
    character.alt,
    character.style,
  );

  const isStock = element.imageType === "stock";
  // A stock icon is already just the head, so it has no crop to apply.
  const uncropped = element.uncropped || isStock;

  let imageSrc = getCharImgUrl({
    characterId: character.id,
    alt: character.alt,
    type: isStock ? "stock" : "main",
    style: character.style,
  });
  let cropOffset = uncropped ? { x: 0, y: 0 } : characterCrop.offset;
  let cropScale =
    (uncropped ? 1 : characterCrop.scale) * (element.cropScaleMultiplier ?? 1);

  if (player.avatarImgSrc) {
    // A custom avatar replaces the character art and is shown uncropped.
    imageSrc = player.avatarImgSrc;
    cropOffset = { x: 0, y: 0 };
    cropScale = 1;
  } else if (character.id === EMPTY_CHARACTER_ID) {
    imageSrc = EMPTY_CHARACTER_DARK_IMG;
  }

  return (
    <CustomImage
      key={getElementKey(element, index)}
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
      fillMode={element.fillMode ?? "contain"}
      align={element.align}
      opacity={element.opacity}
      tone={element.tone}
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
        src: imageSrc,
      };
    },
  );

  const flexGridElement: FlexGridElementConfig = {
    type: "flexGrid",
    id: element.id ?? `alt-flexGrid-${index}`,
    position: { x: 0, y: 0 },
    size: element.size,
    elements: characterImageElements,
    gap: element.gap ?? 5,
    rowGap: element.rowGap,
    columnGap: element.columnGap,
    columns: element.columns,
    rows: element.rows,
    aspectRatio: 1,
    align: element.align,
    justify: element.justify,
    alignLastRow: element.alignLastRow,
    flow: element.flow,
  };

  const flexGrid = createFlexGridElement({
    element: flexGridElement,
    index,
    context,
  });

  return (
    <Group
      key={getElementKey(element, index)}
      x={element.position.x}
      y={element.position.y}
    >
      {flexGrid}
    </Group>
  );
};

export const createCustomAltCharacterImageElement: ElementCreator<
  CustomAltCharacterImageElementConfig
> = ({ element, index, context }) => {
  const { player } = context;

  if (!player) return null;

  const allCharacters = element.includeMainCharacter
    ? player.characters
    : player.characters.slice(1);
  const characters =
    element.characterIndex === undefined
      ? allCharacters
      : allCharacters.slice(element.characterIndex, element.characterIndex + 1);

  if (characters.length === 0) return null;

  const imageType = element.imageType ?? "stock";
  const template = element.elementTemplate;

  if (template) {
    return renderCustomAltWithTemplate(
      element,
      template,
      characters,
      imageType,
      index,
      context,
    );
  }

  const characterImageElements: ImageElementConfig[] = characters.map(
    (character, altIndex) => {
      const imageSrc = getCharImgUrl({
        characterId: character.id,
        alt: character.alt,
        type: imageType === "render" ? "main" : "stock",
        style: character.style,
      });

      return {
        type: "image",
        id: `custom-alt-character-${altIndex}`,
        position: { x: 0, y: 0 },
        src: imageSrc,
      };
    },
  );

  const flexGridElement: FlexGridElementConfig = {
    type: "flexGrid",
    id: element.id ?? `custom-alt-flexGrid-${index}`,
    position: { x: 0, y: 0 },
    size: element.size,
    elements: characterImageElements,
    gap: element.gap ?? 5,
    rowGap: element.rowGap,
    columnGap: element.columnGap,
    columns: element.columns,
    rows: element.rows,
    aspectRatio: 1,
    align: element.align,
    justify: element.justify,
    alignLastRow: element.alignLastRow,
  };

  const flexGrid = createFlexGridElement({
    element: flexGridElement,
    index,
    context,
  });

  return (
    <Group
      key={getElementKey(element, index)}
      x={element.position.x}
      y={element.position.y}
    >
      {flexGrid}
    </Group>
  );
};

function renderCustomAltWithTemplate(
  element: CustomAltCharacterImageElementConfig,
  template: ElementConfig,
  characters: CharacerData[],
  imageType: "stock" | "render",
  index: number,
  context: Parameters<ElementCreator>[0]["context"],
): React.ReactNode {
  const {
    gap = 5,
    rowGap = gap,
    columnGap = gap,
    columns: fixedColumns,
    rows: fixedRows,
    align = "start",
    justify = "start",
    alignLastRow = "start",
    flow = "row",
  } = element;
  const isColumnFlow = flow === "column" && fixedRows !== undefined;

  const numItems = characters.length;
  const preferredCellSize = template.size?.width ?? 70;

  const containerWidth =
    element.size?.width ??
    element.size?.maxWidth ??
    preferredCellSize * numItems;
  const containerHeight = element.size?.height ?? preferredCellSize;

  const optimalGrid = findOptimalSquareGrid(
    numItems,
    containerWidth,
    containerHeight,
    columnGap,
    rowGap,
  );

  const stacks = isColumnFlow
    ? fitColumnStacks(
        numItems,
        fixedRows,
        preferredCellSize,
        containerWidth,
        containerHeight,
        columnGap,
        rowGap,
      )
    : undefined;

  const effectiveColumns =
    stacks?.columns ?? fixedColumns ?? optimalGrid.columns;
  const effectiveRows =
    stacks?.rows ?? fixedRows ?? Math.ceil(numItems / effectiveColumns);

  let cellWidth: number;
  let cellHeight: number;

  if (stacks) {
    cellWidth = stacks.cellSize;
    cellHeight = stacks.cellSize;
  } else if (fixedColumns) {
    cellWidth = preferredCellSize;
    cellHeight = preferredCellSize;
  } else if (fixedRows) {
    const maxCellWidth =
      (containerWidth - (effectiveColumns - 1) * columnGap) / effectiveColumns;
    const maxCellHeight =
      (containerHeight - (effectiveRows - 1) * rowGap) / effectiveRows;
    cellWidth = Math.min(maxCellWidth, maxCellHeight, preferredCellSize);
    cellHeight = cellWidth;
  } else {
    cellWidth = Math.min(optimalGrid.cellSize, preferredCellSize);
    cellHeight = cellWidth;
  }

  const gridContentWidth =
    effectiveColumns * cellWidth + (effectiveColumns - 1) * columnGap;
  const gridContentHeight =
    effectiveRows * cellHeight + (effectiveRows - 1) * rowGap;

  // Stacks are placed inside the box's width (they start at its right
  // edge); row grids are only ever as wide as their content.
  const actualContainerWidth = isColumnFlow
    ? (element.size?.width ?? gridContentWidth)
    : gridContentWidth;
  // A grid shorter than its box is aligned inside the box.
  const actualContainerHeight = containerHeight;

  const gridOffsetX = calculateGridAlignOffset(
    justify,
    actualContainerWidth,
    gridContentWidth,
  );
  const gridOffsetY = calculateGridAlignOffset(
    align,
    actualContainerHeight,
    gridContentHeight,
  );

  const cells = placeGridCells({
    count: numItems,
    columns: effectiveColumns,
    rows: effectiveRows,
    cellWidth,
    cellHeight,
    columnGap,
    rowGap,
    alignLastRow,
    flow: isColumnFlow ? "column" : "row",
  });
  // Stacks draw the template at its own size and scale the whole cell, so
  // what is inside the template shrinks with it.
  const cellScale = stacks ? cellWidth / preferredCellSize : 1;
  const cellSize = stacks
    ? { width: preferredCellSize, height: preferredCellSize }
    : { width: cellWidth, height: cellHeight };

  const renderedElements = characters.map((character, idx) => {
    const { x, y } = cells[idx];

    return (
      <Group
        key={`custom-alt-wrapper-${idx}`}
        x={gridOffsetX + x}
        y={gridOffsetY + y}
        scaleX={cellScale}
        scaleY={cellScale}
      >
        {renderTemplateForCharacter(
          // The template's own size is the preferred cell; draw it at the
          // size the grid settled on.
          { ...template, size: cellSize },
          character,
          imageType,
          idx,
          cellSize,
          context,
        )}
      </Group>
    );
  });

  return (
    <Group
      key={getElementKey(element, index)}
      x={element.position.x}
      y={element.position.y}
    >
      {renderedElements}
    </Group>
  );
}

/**
 * Renders a template element for a specific alt character in a single pass.
 * Reads from the template without cloning — computes derived values inline.
 */
function renderTemplateForCharacter(
  template: ElementConfig,
  character: CharacerData,
  imageType: "stock" | "render",
  altIndex: number,
  cellSize: { width: number; height: number },
  context: Parameters<ElementCreator>[0]["context"],
): React.ReactNode {
  const width = template.size?.width ?? cellSize.width;
  const height = template.size?.height ?? cellSize.height;

  if (template.type === "group") {
    const groupEl = template as GroupElementConfig;
    return (
      <Group
        key={
          groupEl.id
            ? `${groupEl.id}-alt-${altIndex}`
            : `template-group-${altIndex}`
        }
        x={template.position.x}
        y={template.position.y}
        width={width}
        height={height}
        clipFunc={
          groupEl.clip
            ? (ctx) => {
                ctx.beginPath();
                if (groupEl.clipCornerRadius) {
                  ctx.roundRect(0, 0, width, height, groupEl.clipCornerRadius);
                } else {
                  ctx.rect(0, 0, width, height);
                }
                ctx.closePath();
              }
            : undefined
        }
      >
        {groupEl.elements.map((child) =>
          renderTemplateForCharacter(
            child,
            character,
            imageType,
            altIndex,
            cellSize,
            context,
          ),
        )}
      </Group>
    );
  }

  if (template.type === "rect") {
    const rectEl = template as ElementConfig & {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      cornerRadius?: number | number[];
    };
    return (
      <Rect
        key={
          rectEl.id
            ? `${rectEl.id}-alt-${altIndex}`
            : `template-rect-${altIndex}`
        }
        x={template.position.x}
        y={template.position.y}
        width={width}
        height={height}
        fill={resolveColor(rectEl.fill, context.design?.colorPalette)}
        stroke={resolveColor(rectEl.stroke, context.design?.colorPalette)}
        strokeWidth={rectEl.strokeWidth}
        cornerRadius={rectEl.cornerRadius}
        perfectDrawEnabled={context.perfectDraw}
      />
    );
  }

  if (template.type === "characterImage") {
    const charEl = template as CharacterImageElementConfig;
    const imageSrc = getCharImgUrl({
      characterId: character.id,
      alt: character.alt,
      type: imageType === "render" ? "main" : "stock",
      style: character.style,
    });

    if (imageType === "render") {
      const characterCrop = getCharacterCrop(
        character.id,
        character.alt,
        character.style,
      );
      const cropScale = characterCrop.scale * (charEl.cropScaleMultiplier ?? 1);

      return (
        <CustomImage
          key={
            charEl.id ? `${charEl.id}-alt-${altIndex}` : `alt-char-${altIndex}`
          }
          x={template.position.x}
          y={template.position.y}
          width={width}
          height={height}
          imageSrc={imageSrc}
          cropOffset={characterCrop.offset}
          cropScale={cropScale}
          fillMode={charEl.fillMode ?? "contain"}
          hasShadow={charEl.shadowEnabled ?? false}
          shadowColor={resolveColor(
            charEl.shadowColor,
            context.design?.colorPalette,
          )}
          shadowBlur={charEl.shadowBlur}
          shadowOpacity={charEl.shadowOpacity}
          perfectDrawEnabled={context.perfectDraw}
        />
      );
    }

    return (
      <CustomImage
        key={
          charEl.id ? `${charEl.id}-alt-${altIndex}` : `alt-char-${altIndex}`
        }
        x={template.position.x}
        y={template.position.y}
        width={width}
        height={height}
        imageSrc={imageSrc}
        perfectDrawEnabled={context.perfectDraw}
      />
    );
  }

  if (template.type === "image") {
    const imgEl = template as ImageElementConfig;
    return (
      <CustomImage
        key={
          imgEl.id ? `${imgEl.id}-alt-${altIndex}` : `template-img-${altIndex}`
        }
        x={template.position.x}
        y={template.position.y}
        width={width}
        height={height}
        imageSrc={imgEl.src}
        perfectDrawEnabled={context.perfectDraw}
      />
    );
  }

  return null;
}

export const createPlayerFlagElement: ElementCreator<
  PlayerFlagElementConfig
> = ({ element, index, context }) => {
  const { player } = context;

  const flagSrc =
    player?.customFlagSrc ??
    (player?.country
      ? `/assets/flags/${player.country.toLowerCase()}.svg`
      : null);

  if (!flagSrc) {
    return null;
  }

  return (
    <CustomImage
      key={getElementKey(element, index)}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 40}
      height={element.size?.height ?? 30}
      imageSrc={flagSrc}
      fillMode={element.fillMode ?? "contain"}
      align={element.align ?? "center"}
      opacity={element.opacity}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};
