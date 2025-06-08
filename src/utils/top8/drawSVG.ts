import { FabricObject, GroupProps, loadSVGFromURL, util } from "fabric";

import { defaultOptions } from "@/consts/top8/FabricOptions";

const color1 = "#1d1d1d";
const color2 = "#0f0";
const frame = "white";

export const drawSVG = async (
  url: string,
  options: Partial<GroupProps> = { width: 200 }
): Promise<FabricObject> => {
  return new Promise((resolve, reject) => {
    loadSVGFromURL(url)
      .then((svg) => {
        try {
          const objects = svg.objects.filter((obj) => !!obj);
          const width = options.width || 200;

          objects.forEach((obj) => {
            if (obj.id === "bg-1") obj.fill = color1;
            if (obj.id === "bg-2") obj.fill = color2;
            if (obj.id === "frame") obj.fill = frame;
          });

          const obj = util.groupSVGElements(objects, {
            ...defaultOptions,
            ...options,
          });

          obj.scaleToWidth(width);

          resolve(obj);
        } catch (error) {
          console.error("Error processing SVG:", error);
          reject(null);
        }
      })
      .catch((error) => {
        console.error("Error loading SVG:", error);
        reject(null);
      });
  });
};
