import {
  FabricImage,
  FabricObject,
  Group,
  Rect,
  Shadow,
  Textbox,
} from "fabric";

import { CanvasIDs } from "@/consts/top8/CanvasIDs";
import { PlayerInfo } from "@/types/top8/Result";
import { drawSVG } from "@/utils/top8/drawSVG";
import { getCharObj } from "@/utils/top8/getCharObj";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { defaultOptions } from "@/consts/top8/FabricOptions";

import frameAsset from "/assets/top8/theme/mini/frame.svg";

export class Player {
  playerInfo: PlayerInfo;
  object?: FabricObject;
  width = 250;

  constructor(player: PlayerInfo) {
    this.playerInfo = player;
    this.createPlayerObject.bind(this);
    this.updatePlayerObject.bind(this);
  }

  async updatePlayerInfo(player: PlayerInfo) {
    this.playerInfo = player;
    await this.updatePlayerObject();
  }

  async createPlayerObject() {
    const {
      character: characterId,
      alt,
      name,
      placement,
      id,
    } = this.playerInfo;

    // Draw frame
    const [frame, char] = await Promise.all([
      drawSVG(frameAsset, {
        id: CanvasIDs.FRAME,
        width: this.width,
        top: 0,
        left: 0,
      }),
      getCharObj(
        getCharImgUrl({
          characterId,
          alt,
        }),
        {
          id: CanvasIDs.CHARACTER,
          width: this.width - 50,
          left: 10,
          top: 10,
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
        }
      ),
    ]);

    char.clipPath = new Rect({
      left: -(char.width / 2),
      top: -(char.height / 2),
      width: this.width - 20,
      height: this.width - 20,
      absolutePositioned: false,
    });

    // Draw name
    const text = new Textbox(name, {
      id: CanvasIDs.NAME,
      fontFamily: "Roboto",
      fontSize: 20,
      width: frame.getScaledWidth(),
      fill: "white",
      top: frame.getScaledHeight() + 10,
      left: frame.getScaledWidth() / 2,
      originX: "center",
      textAlign: "center",
      shadow: new Shadow({
        color: "rgba(0,0,0,1)", // Fully opaque for a hard shadow
        blur: 0, // No blur = hard edge
        offsetX: 2,
        offsetY: 2,
      }),
    });

    // Draw placement
    const placementObj = new Textbox(placement.toString(), {
      fontFamily: "Roboto",
      fontSize: 60,
      fill: "red",
      top: 0,
      left: 0,
      textAlign: "center",
      stroke: "black",
    });

    const group = new Group([char, frame, text, placementObj], {
      id,
      playerInfo: this.playerInfo,
      name: CanvasIDs.MAIN_GROUP,
      ...defaultOptions,
    });

    this.object = group;
  }

  async updatePlayerObject() {
    if (!this.object) {
      throw new Error("Player object is not created yet");
    }

    const info = this.playerInfo;
    const objects = this.object._objects;

    console.log("Updating player object with info:", info);

    // Set name
    const nameObj = objects.find((obj) => obj.id === CanvasIDs.NAME);
    if (!nameObj) throw new Error("No name object found");

    nameObj.set({ text: info.name });

    // Set character
    const characterObj = objects.find((obj) => obj.id === CanvasIDs.CHARACTER);
    if (!characterObj) throw new Error("No character object found");

    const mainImage = characterObj._objects.find(
      (obj) => obj.id === CanvasIDs.CHARACTER
    ) as FabricImage;
    if (!mainImage) throw new Error("No main image object found");

    // Redraw backdrop
    const backdrop = characterObj._objects.find(
      (obj) => obj.id === CanvasIDs.BACKDROP_IMAGE
    ) as FabricImage;
    if (!backdrop) throw new Error("No backdrop image object found");

    const src = getCharImgUrl({
      characterId: info.character,
      alt: info.alt,
    });

    await Promise.all([
      mainImage.setSrc(src, { crossOrigin: "anonymous" }),
      backdrop.setSrc(src, { crossOrigin: "anonymous" }),
    ]);

    const width = this.object.width * this.object.scaleX;

    mainImage.scaleToWidth(width);
    backdrop.scaleToWidth(width);

    this.object.set({
      playerName: info.name,
      characterId: info.character,
      alt: info.alt,
    });

    console.log("Player object updated:", this.object);
  }
}
