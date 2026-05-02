import { memo, useMemo } from "react";
import { Image as KonvaImage } from "react-konva";

import { CharacterElement } from "@/types/thumbnail/ThumbnailDesign";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { getCharacterCrop } from "@/utils/top8/getCharacterCrop";
import { useCustomImage } from "@/hooks/top8/useCustomImage";

type Props = {
  element: CharacterElement;
  draggable: boolean;
};

const ZERO_OFFSET = { x: 0, y: 0 };

const CharacterNodeComponent = ({ element, draggable }: Props) => {
  const src = useMemo(
    () =>
      getCharImgUrl({
        characterId: element.characterId,
        alt: element.alt as 0,
        type: element.imageType,
      }),
    [element.characterId, element.alt, element.imageType],
  );

  const crop = useMemo(
    () => getCharacterCrop(element.characterId, element.alt),
    [element.characterId, element.alt],
  );

  const { finalImage, ref } = useCustomImage({
    imageSrc: src,
    width: element.width,
    height: element.height,
    fillMode: "cover",
    align: "center",
    offset: ZERO_OFFSET,
    cropOffset: crop.offset,
    cropScale: crop.scale,
    flipX: element.flipX,
  });

  if (!finalImage) return null;

  return (
    <KonvaImage
      ref={ref}
      id={element.id}
      name={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      visible={element.visible}
      listening={!element.locked}
      draggable={draggable && !element.locked}
      image={finalImage}
    />
  );
};

export const CharacterNode = memo(CharacterNodeComponent);
