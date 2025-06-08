import * as fabric from "fabric";

import { defaultOptions } from "@/consts/top8/FabricOptions";
import { CanvasIDs } from "@/consts/top8/CanvasIDs";

const SHADOW_OFFSET = 5;

export const getCharObj = async (
  url: string,
  options: Partial<fabric.GroupProps> = { width: 200 }
): Promise<fabric.Group> => {
  return new Promise((resolve, reject) => {
    fabric.FabricImage.fromURL(url, {
      ...defaultOptions,
      crossOrigin: "anonymous",
    })
      .then((img) => {
        const width = options.width || 200;

        img.set({
          top: 0,
          left: 0,
          ...defaultOptions,
        });

        if (img.width > img.height) {
          img.scaleToWidth(width);
        } else {
          img.scaleToHeight(width * 1.2);
        }

        img.clone().then((backdrop) => {
          const filter = new fabric.filters.Composed({
            subFilters: [
              new fabric.filters.Blur({
                blur: 0.1,
              }),
              new fabric.filters.BlendColor({
                color: "red",
                mode: "tint",
                alpha: 1,
              }),
            ],
          });
          backdrop.filters = [filter];
          backdrop.applyFilters();
          backdrop.set({
            id: CanvasIDs.BACKDROP_IMAGE,
            top: SHADOW_OFFSET,
            left: SHADOW_OFFSET,
          });

          const imageGroup = new fabric.Group([backdrop, img], {
            id: CanvasIDs.CHARACTER,
            width,
            ...options,
          });

          resolve(imageGroup);
        });
      })
      .catch((error) => {
        console.error("Error loading character image:", error);
        reject(null);
      });
  });
};
