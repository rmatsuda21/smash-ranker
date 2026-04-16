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
import { EMPTY_CHARACTER_ID, EMPTY_CHARACTER_DARK_IMG } from "@/consts/top8/characters";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { getCharacterCrop } from "@/utils/top8/getCharacterCrop";
import { resolveColor } from "@/utils/top8/resolveColor";
import { createFlexGridElement, calculateGridAlignOffset, findOptimalSquareGrid } from "./layout";

type CharacterImageWithAltData = CharacterImageElementConfig & {
  _altCharacter?: CharacerData;
  _altImageSrc?: string;
};

export const createCharacterImageElement: ElementCreator<
  CharacterImageElementConfig
> = ({ element, index, context }) => {
  const { player, design } = context;
  const elementWithAlt = element as CharacterImageWithAltData;

  const isAltCharacter = !!elementWithAlt._altCharacter;
  if (!isAltCharacter && (!player || player.characters.length === 0)) {
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

  const character = isAltCharacter
    ? elementWithAlt._altCharacter!
    : player!.characters[0];

  let imageSrc = isAltCharacter
    ? elementWithAlt._altImageSrc!
    : getCharImgUrl({
      characterId: character.id,
      alt: character.alt,
    });

  const characterCrop = getCharacterCrop(character.id, character.alt);
  let cropOffset = characterCrop.offset;
  let cropScale = characterCrop.scale * (element.cropScaleMultiplier ?? 1);

  if (!isAltCharacter && context.player?.avatarImgSrc) {
    imageSrc = context.player.avatarImgSrc;
    cropOffset = { x: 0, y: 0 };
    cropScale = 1;
  }

  if (!isAltCharacter && character.id === EMPTY_CHARACTER_ID && !context.player?.avatarImgSrc) {
    imageSrc = EMPTY_CHARACTER_DARK_IMG;
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
      fillMode={element.fillMode ?? "contain"}
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
    }
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
      key={element.id ?? `alt-group-${index}`}
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

  const characters = element.includeMainCharacter
    ? player.characters
    : player.characters.slice(1);

  if (characters.length === 0) return null;

  const imageType = element.imageType ?? "stock";
  const template = element.elementTemplate;

  if (template) {
    return renderCustomAltWithTemplate(element, template, characters, imageType, index, context);
  }

  const characterImageElements: ImageElementConfig[] = characters.map(
    (character, altIndex) => {
      const imageSrc = getCharImgUrl({
        characterId: character.id,
        alt: character.alt,
        type: imageType === "render" ? "main" : "stock",
      });

      return {
        type: "image",
        id: `custom-alt-character-${altIndex}`,
        position: { x: 0, y: 0 },
        src: imageSrc,
      };
    }
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
      key={element.id ?? `custom-alt-group-${index}`}
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
  context: Parameters<ElementCreator>[0]["context"]
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
  } = element;

  const numItems = characters.length;
  const preferredCellSize = template.size?.width ?? 70;

  const containerWidth = element.size?.width ?? element.size?.maxWidth ?? preferredCellSize * numItems;
  const containerHeight = element.size?.height ?? preferredCellSize;

  const optimalGrid = findOptimalSquareGrid(numItems, containerWidth, containerHeight, columnGap, rowGap);

  const effectiveColumns = fixedColumns ?? optimalGrid.columns;
  const effectiveRows = fixedRows ?? Math.ceil(numItems / effectiveColumns);

  let cellWidth: number;
  let cellHeight: number;

  if (fixedColumns) {
    cellWidth = preferredCellSize;
    cellHeight = preferredCellSize;
  } else if (fixedRows) {
    const maxCellWidth = (containerWidth - (effectiveColumns - 1) * columnGap) / effectiveColumns;
    const maxCellHeight = (containerHeight - (effectiveRows - 1) * rowGap) / effectiveRows;
    cellWidth = Math.min(maxCellWidth, maxCellHeight, preferredCellSize);
    cellHeight = cellWidth;
  } else {
    cellWidth = Math.min(optimalGrid.cellSize, preferredCellSize);
    cellHeight = cellWidth;
  }

  const gridContentWidth = effectiveColumns * cellWidth + (effectiveColumns - 1) * columnGap;
  const gridContentHeight = effectiveRows * cellHeight + (effectiveRows - 1) * rowGap;

  const actualContainerWidth = gridContentWidth;
  const actualContainerHeight = Math.min(gridContentHeight, containerHeight);

  const gridOffsetX = calculateGridAlignOffset(justify, actualContainerWidth, gridContentWidth);
  const gridOffsetY = calculateGridAlignOffset(align, actualContainerHeight, gridContentHeight);

  const lastRowItemCount = numItems % effectiveColumns || effectiveColumns;
  const isLastRowFull = lastRowItemCount === effectiveColumns;

  const cellSize = { width: cellWidth, height: cellHeight };

  const renderedElements = characters.map((character, idx) => {
    const row = Math.floor(idx / effectiveColumns);
    const col = idx % effectiveColumns;
    const isLastRow = row === effectiveRows - 1;

    let x = col * (cellWidth + columnGap);
    const y = row * (cellHeight + rowGap);

    if (isLastRow && !isLastRowFull) {
      const lastRowWidth =
        lastRowItemCount * cellWidth + (lastRowItemCount - 1) * columnGap;
      const lastRowOffset = calculateGridAlignOffset(
        alignLastRow,
        gridContentWidth,
        lastRowWidth
      );
      x += lastRowOffset;
    }

    return (
      <Group
        key={`custom-alt-wrapper-${idx}`}
        x={gridOffsetX + x}
        y={gridOffsetY + y}
      >
        {renderTemplateForCharacter(template, character, imageType, idx, cellSize, context)}
      </Group>
    );
  });

  return (
    <Group
      key={element.id ?? `custom-alt-group-${index}`}
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
  context: Parameters<ElementCreator>[0]["context"]
): React.ReactNode {
  const width = template.size?.width ?? cellSize.width;
  const height = template.size?.height ?? cellSize.height;

  if (template.type === "group") {
    const groupEl = template as GroupElementConfig;
    return (
      <Group
        key={groupEl.id ? `${groupEl.id}-alt-${altIndex}` : `template-group-${altIndex}`}
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
          renderTemplateForCharacter(child, character, imageType, altIndex, cellSize, context)
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
        key={rectEl.id ? `${rectEl.id}-alt-${altIndex}` : `template-rect-${altIndex}`}
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
    });

    if (imageType === "render") {
      const characterCrop = getCharacterCrop(character.id, character.alt);
      const cropScale = characterCrop.scale * (charEl.cropScaleMultiplier ?? 1);

      return (
        <CustomImage
          key={charEl.id ? `${charEl.id}-alt-${altIndex}` : `alt-char-${altIndex}`}
          x={template.position.x}
          y={template.position.y}
          width={width}
          height={height}
          imageSrc={imageSrc}
          cropOffset={characterCrop.offset}
          cropScale={cropScale}
          fillMode={charEl.fillMode ?? "contain"}
          hasShadow={charEl.shadowEnabled ?? false}
          shadowColor={resolveColor(charEl.shadowColor, context.design?.colorPalette)}
          shadowBlur={charEl.shadowBlur}
          shadowOpacity={charEl.shadowOpacity}
          perfectDrawEnabled={context.perfectDraw}
        />
      );
    }

    return (
      <CustomImage
        key={charEl.id ? `${charEl.id}-alt-${altIndex}` : `alt-char-${altIndex}`}
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
        key={imgEl.id ? `${imgEl.id}-alt-${altIndex}` : `template-img-${altIndex}`}
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

  const flagSrc = player?.customFlagSrc
    ?? (player?.country ? `/assets/flags/${player.country.toLowerCase()}.svg` : null);

  if (!flagSrc) {
    return null;
  }

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
