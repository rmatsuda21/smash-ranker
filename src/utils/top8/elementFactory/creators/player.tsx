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
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { getCharacterCrop } from "@/utils/top8/getCharacterCrop";
import { resolveColor } from "@/utils/top8/resolveColor";
import { createFlexGridElement } from "./layout";

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
  let cropScale = characterCrop.scale;

  if (!isAltCharacter && context.player?.avatarImgSrc) {
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

  if (!player || player.characters.length <= 1) {
    return null;
  }

  const altCharacters = player.characters.slice(1);
  const imageType = element.imageType ?? "stock";
  const template = element.elementTemplate;

  // If we have a full element template, we need to manually calculate grid layout
  // and propagate sizes to nested elements
  if (template) {
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

    const numItems = altCharacters.length;
    const templateSize = template.size;

    // Get preferred cell size from template
    const preferredCellSize = templateSize?.width ?? 70;

    // Get container dimensions
    const containerWidth = element.size?.width ?? element.size?.maxWidth ?? preferredCellSize * numItems;
    const containerHeight = element.size?.height ?? preferredCellSize;

    // Find optimal grid configuration that maximizes cell size while fitting all items
    let bestColumns = 1;
    let bestCellSize = 0;

    for (let cols = 1; cols <= numItems; cols++) {
      const rows = Math.ceil(numItems / cols);

      // Calculate max cell size that fits in this configuration
      const maxCellWidth = (containerWidth - (cols - 1) * columnGap) / cols;
      const maxCellHeight = (containerHeight - (rows - 1) * rowGap) / rows;
      const cellSize = Math.min(maxCellWidth, maxCellHeight);

      // Skip if cells would be too small (less than 10px)
      if (cellSize < 10) continue;

      // Choose configuration with largest cell size
      if (cellSize > bestCellSize) {
        bestCellSize = cellSize;
        bestColumns = cols;
      }
    }

    // Apply fixed columns/rows if specified
    const effectiveColumns = fixedColumns ?? bestColumns;
    const effectiveRows = fixedRows ?? Math.ceil(numItems / effectiveColumns);

    // Calculate final cell size (capped by preferred size)
    let cellWidth = Math.min(bestCellSize, preferredCellSize);
    let cellHeight = cellWidth; // Keep square

    // Recalculate if fixed columns/rows were specified
    if (fixedColumns || fixedRows) {
      const maxCellWidth = (containerWidth - (effectiveColumns - 1) * columnGap) / effectiveColumns;
      const maxCellHeight = (containerHeight - (effectiveRows - 1) * rowGap) / effectiveRows;
      cellWidth = Math.min(maxCellWidth, maxCellHeight, preferredCellSize);
      cellHeight = cellWidth;
    }

    // Calculate actual content size based on the grid we'll actually render
    const gridContentWidth = effectiveColumns * cellWidth + (effectiveColumns - 1) * columnGap;
    const gridContentHeight = effectiveRows * cellHeight + (effectiveRows - 1) * rowGap;

    // Use the actual content size (not the container max size) for proper alignment
    const actualContainerWidth = gridContentWidth;
    const actualContainerHeight = Math.min(gridContentHeight, containerHeight);

    const gridOffsetX = calculateGridAlignOffset(justify, actualContainerWidth, gridContentWidth);
    const gridOffsetY = calculateGridAlignOffset(align, actualContainerHeight, gridContentHeight);

    const lastRowItemCount = numItems % effectiveColumns || effectiveColumns;
    const isLastRowFull = lastRowItemCount === effectiveColumns;

    // Transform and render each alt character with the template
    const transformedElements = altCharacters.map((character, idx) => {
      const row = Math.floor(idx / effectiveColumns);
      const col = idx % effectiveColumns;
      const isLastRow = row === effectiveRows - 1;

      let x = col * (cellWidth + columnGap);
      const y = row * (cellHeight + rowGap);

      // Handle last row alignment
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

      const finalX = gridOffsetX + x;
      const finalY = gridOffsetY + y;

      // Transform the template for this alt character, propagating the cell size
      const transformedTemplate = transformTemplateForAltCharacter(
        template,
        character,
        imageType,
        idx,
        { width: cellWidth, height: cellHeight }
      );

      return (
        <Group
          key={`custom-alt-wrapper-${idx}`}
          x={finalX}
          y={finalY}
        >
          {renderTemplateElement(transformedTemplate, idx, context)}
        </Group>
      );
    });

    return (
      <Group
        key={element.id ?? `custom-alt-group-${index}`}
        x={element.position.x}
        y={element.position.y}
      >
        {transformedElements}
      </Group>
    );
  }

  const characterImageElements: ImageElementConfig[] = altCharacters.map(
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

function calculateGridAlignOffset(
  alignment: "start" | "center" | "end",
  containerSize: number,
  contentSize: number
): number {
  switch (alignment) {
    case "center":
      return (containerSize - contentSize) / 2;
    case "end":
      return containerSize - contentSize;
    default:
      return 0;
  }
}

function transformTemplateForAltCharacter(
  template: ElementConfig,
  character: CharacerData,
  imageType: "stock" | "render",
  altIndex: number,
  containerSize: { width: number; height: number }
): ElementConfig {
  const cloned = JSON.parse(JSON.stringify(template)) as ElementConfig;
  return transformElement(cloned, character, imageType, altIndex, containerSize);
}

function transformElement(
  element: ElementConfig,
  character: CharacerData,
  imageType: "stock" | "render",
  altIndex: number,
  containerSize: { width: number; height: number }
): ElementConfig {
  const elementWithSize = {
    ...element,
    size: {
      width: element.size?.width ?? containerSize.width,
      height: element.size?.height ?? containerSize.height,
    },
  };

  if (element.type === "characterImage") {
    const imageSrc = getCharImgUrl({
      characterId: character.id,
      alt: character.alt,
      type: imageType === "render" ? "main" : "stock",
    });

    if (imageType === "render") {
      return {
        ...elementWithSize,
        type: "characterImage",
        id: element.id ? `${element.id}-alt-${altIndex}` : `alt-char-${altIndex}`,
        _altCharacter: character,
        _altImageSrc: imageSrc,
      } as CharacterImageElementConfig & {
        _altCharacter: CharacerData;
        _altImageSrc: string;
      };
    } else {
      return {
        type: "image",
        id: element.id ? `${element.id}-alt-${altIndex}` : `alt-char-${altIndex}`,
        position: element.position,
        size: elementWithSize.size,
        src: imageSrc,
      } as ImageElementConfig;
    }
  }

  if ("elements" in element && Array.isArray(element.elements)) {
    const groupElement = element as GroupElementConfig;
    return {
      ...elementWithSize,
      type: groupElement.type,
      id: groupElement.id ? `${groupElement.id}-alt-${altIndex}` : undefined,
      elements: groupElement.elements.map((child) =>
        transformElement(child, character, imageType, altIndex, containerSize)
      ),
    } as GroupElementConfig;
  }

  return {
    ...elementWithSize,
    id: element.id ? `${element.id}-alt-${altIndex}` : undefined,
  };
}

function renderTemplateElement(
  element: ElementConfig,
  index: number,
  context: Parameters<ElementCreator>[0]["context"]
): React.ReactNode {
  if (element.type === "group") {
    const groupEl = element as GroupElementConfig;
    return (
      <Group
        key={element.id ?? `template-group-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width}
        height={element.size?.height}
        clipFunc={
          groupEl.clip
            ? (ctx) => {
              ctx.beginPath();
              ctx.rect(0, 0, element.size?.width ?? 0, element.size?.height ?? 0);
              ctx.closePath();
            }
            : undefined
        }
      >
        {groupEl.elements.map((child, childIndex) =>
          renderTemplateElement(child, childIndex, context)
        )}
      </Group>
    );
  }

  if (element.type === "rect") {
    const rectEl = element as ElementConfig & {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      cornerRadius?: number | number[];
    };
    return (
      <Rect
        key={element.id ?? `template-rect-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width}
        height={element.size?.height}
        fill={resolveColor(rectEl.fill, context.design?.colorPalette)}
        stroke={resolveColor(rectEl.stroke, context.design?.colorPalette)}
        strokeWidth={rectEl.strokeWidth}
        cornerRadius={rectEl.cornerRadius}
        perfectDrawEnabled={context.perfectDraw}
      />
    );
  }

  if (element.type === "characterImage") {
    const charEl = element as CharacterImageWithAltData;

    if (!charEl._altCharacter) {
      return null;
    }

    const characterCrop = getCharacterCrop(charEl._altCharacter.id, charEl._altCharacter.alt);

    return (
      <CustomImage
        key={element.id ?? `template-char-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width ?? 100}
        height={element.size?.height ?? 100}
        imageSrc={charEl._altImageSrc!}
        cropOffset={characterCrop.offset}
        cropScale={characterCrop.scale}
        hasShadow={charEl.shadowEnabled ?? false}
        shadowColor={resolveColor(charEl.shadowColor, context.design?.colorPalette)}
        shadowBlur={charEl.shadowBlur}
        shadowOpacity={charEl.shadowOpacity}
        perfectDrawEnabled={context.perfectDraw}
      />
    );
  }

  if (element.type === "image") {
    const imgEl = element as ImageElementConfig;
    return (
      <CustomImage
        key={element.id ?? `template-img-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width ?? 100}
        height={element.size?.height ?? 100}
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
