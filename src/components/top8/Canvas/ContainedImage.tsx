import { ComponentProps, useState, useEffect } from "react";
import { Group, Image } from "react-konva";

export const ContainedImage = ({
  width,
  height,
  image,
  hasBackdrop = false,
  backdropColor = "red",
  x = 0,
  y = 0,
  ...rest
}: ComponentProps<typeof Image> & {
  width: number;
  height: number;
  image: HTMLImageElement;
  hasBackdrop?: boolean;
  backdropColor?: string;
}) => {
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [imgPosition, setImgPosition] = useState({ x, y });
  const [coloredImage, setColoredImage] = useState<HTMLImageElement>();

  useEffect(() => {
    const imageAspectRatio = image.width / image.height;
    const containerAspectRatio = width / height;

    let imgWidth = width;
    let imgHeight = height;
    let imgX = x;
    let imgY = y;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      imgHeight = width / imageAspectRatio;
    } else {
      // Image is taller than container
      imgWidth = height * imageAspectRatio;
      imgX = (width - imgWidth) / 2;
    }

    setImgDimensions({ width: imgWidth, height: imgHeight });
    setImgPosition({ x: imgX, y: imgY });
  }, [image, x, y, width, height]);

  useEffect(() => {
    if (!image || !hasBackdrop) return;

    // Create a canvas to apply the color filter
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Draw the original image
    ctx.drawImage(image, 0, 0);

    // Apply red color overlay using composite operation
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = backdropColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create new image from canvas
    const img = new window.Image();
    img.src = canvas.toDataURL();
    img.onload = () => setColoredImage(img);
  }, [image, hasBackdrop, backdropColor]);

  return (
    <Group>
      {hasBackdrop && coloredImage && (
        <Image
          x={imgPosition.x + 10}
          y={imgPosition.y + 10}
          width={imgDimensions.width}
          height={imgDimensions.height}
          image={coloredImage}
        />
      )}
      <Image
        x={imgPosition.x}
        y={imgPosition.y}
        width={imgDimensions.width}
        height={imgDimensions.height}
        image={image}
        {...rest}
      />
    </Group>
  );
};
