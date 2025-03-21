import * as fabric from "fabric";

import { defaultOptions } from "@/consts/Top8/defaultFabricOptions";

const color1 = "#1d1d1d";
const color2 = "#00f";
const frame = "white";

export const drawSVG = async (
  url: string,
  options?: Partial<fabric.GroupProps>
) => {
  const svg = await fabric.loadSVGFromURL(url);
  const objects = svg.objects as fabric.Object[];

  objects.forEach((obj) => {
    if (obj.id === "color1") obj.fill = color1;
    if (obj.id === "color2") obj.fill = color2;
    if (obj.id === "frame") obj.fill = frame;
  });

  const obj = fabric.util.groupSVGElements(objects, {
    ...defaultOptions,
    ...options,
  });
  return obj;
};
