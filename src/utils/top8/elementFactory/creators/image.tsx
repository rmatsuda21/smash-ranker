import { Group, Rect } from "react-konva";

import type {
  ImageElementConfig,
  CustomImageElementConfig,
  SvgElementConfig,
  TournamentIconElementConfig,
  BackgroundImageElementConfig,
} from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import { CustomSVG } from "@/components/top8/Canvas/CustomSVG";
import { resolvePaletteColors } from "@/utils/top8/resolveColor";
import { getElementKey } from "../elementKey";

export const createImageElement: ElementCreator<ImageElementConfig> = ({
  element,
  index,
}) => {
  return (
    <CustomImage
      key={getElementKey(element, index)}
      id={`image-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width ?? 100}
      height={element.size?.height ?? 100}
      imageSrc={element.src}
    />
  );
};

export const createCustomImageElement: ElementCreator<
  CustomImageElementConfig
> = ({ element, index, context }) => {
  const { containerSize } = context;

  const width = element.size?.width ?? containerSize?.width ?? 100;
  const height = element.size?.height ?? containerSize?.height ?? 100;

  return (
    <CustomImage
      key={getElementKey(element, index)}
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

export const createSvgElement: ElementCreator<SvgElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { design } = context;

  const resolvedPalette = resolvePaletteColors(
    element.palette,
    design?.colorPalette,
  );

  return (
    <CustomSVG
      key={getElementKey(element, index)}
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

export const createTournamentIconElement: ElementCreator<
  TournamentIconElementConfig
> = ({ element, index, context }) => {
  const { tournament } = context;

  if (!tournament?.iconSrc) {
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

  return (
    <CustomImage
      key={getElementKey(element, index)}
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

export const createBackgroundImageElement: ElementCreator<
  BackgroundImageElementConfig
> = ({ element, index, context }) => {
  const backgroundImgId = context.design?.bgAssetId ?? "";
  const darkness = context.design?.bgImageDarkness ?? 0;
  const width = element.size?.width ?? 100;
  const height = element.size?.height ?? 100;

  if (!backgroundImgId) {
    return null;
  }

  return (
    <Group key={getElementKey(element, index)}>
      <CustomImage
        imageSrc={backgroundImgId}
        x={element.position.x}
        y={element.position.y}
        width={width}
        height={height}
        fillMode={element.fillMode ?? "contain"}
        align={element.align ?? "center"}
        perfectDrawEnabled={context.perfectDraw}
      />
      {darkness > 0 && (
        <Rect
          x={element.position.x}
          y={element.position.y}
          width={width}
          height={height}
          fill="#000000"
          opacity={darkness}
          listening={false}
          perfectDrawEnabled={context.perfectDraw}
        />
      )}
    </Group>
  );
};
