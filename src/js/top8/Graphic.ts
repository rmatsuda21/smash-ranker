import { CanvasColors } from "@/consts/top8/CanvasColors";
import { CanvasConfig, CanvasEvents, CanvasTheme } from "@/types/top8/Canvas";
import { Tournament } from "@/types/top8/Tournament";
import { Canvas } from "fabric";
import { Player } from "./Player";
import { PlayerInfo } from "@/types/top8/Result";

export interface Graphic {
  tournament: Tournament;
  canvas: Canvas;
  theme: CanvasTheme;
  players: Player[];
  ready: boolean;

  renderGraphic(): Promise<void>;
  findPlayer(id: string): Player | undefined;
  downloadGraphic(filename: string): void;
  setCanvasEvents(events: CanvasEvents): void;
  updatePlayer(player: Player, newPlayerInfo: PlayerInfo): Promise<boolean>;
  dispose(): void;
  setCanvasEditable(editable: boolean): void;
}

export class BaseGraphic implements Graphic {
  tournament: Tournament;
  canvas: Canvas;
  theme: CanvasTheme = {
    [CanvasColors.MAIN]: "white",
    [CanvasColors.SECONDARY]: "black",
  };
  players: Player[] = [];
  ready = false;

  constructor(
    tournament: Tournament,
    canvas: HTMLCanvasElement,
    canvasConfig: CanvasConfig
  ) {
    this.tournament = tournament;
    this.canvas = new Canvas(canvas, {
      selection: canvasConfig.selection || false,
      width: canvasConfig.width,
      height: canvasConfig.height,
      backgroundColor: canvasConfig.backgroundColor || "black",
    });

    this.players = this.tournament.result.map((player) => new Player(player));

    Promise.allSettled(
      this.players.map((player) => player.createPlayerObject())
    ).then(() => {
      this.ready = true;
      this.players.forEach((player, index) => {
        const playerObject = player.object;
        if (playerObject) {
          const numRows = 2;
          const numCols = Math.ceil(this.players.length / numRows);
          const col = index % numCols;
          const row = Math.floor(index / numCols);
          const cellWidth = canvasConfig.width / numCols;
          const cellHeight = canvasConfig.height / numRows;

          playerObject.set({
            left: col * cellWidth,
            top: row * cellHeight,
          });

          this.canvas.add(playerObject);
        }
      });
    });
  }

  async renderGraphic(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  dispose() {
    if (this.canvas) {
      this.canvas.dispose();
    }
  }

  setCanvasEvents({ onPlayerSelected, onPlayerCleared }: CanvasEvents) {
    if (!this.canvas) {
      throw new Error("Canvas is not initialized");
    }

    this.canvas.on("object:moving", (e) => {
      const obj = e.target;

      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;

      const objWidth = obj.width * obj.scaleX;
      const objHeight = obj.height * obj.scaleY;

      obj.left = Math.max(0, Math.min(obj.left, canvasWidth - objWidth));
      obj.top = Math.max(0, Math.min(obj.top, canvasHeight - objHeight));
    });

    this.canvas.on("selection:created", onPlayerSelected);
    this.canvas.on("selection:updated", onPlayerSelected);
    this.canvas.on("selection:cleared", onPlayerCleared);

    // TODO: Implement undo/redo
    // canvas.on("object:added", (e) => {
    //   undoStack.push(e.target.canvas?.toJSON());
    // });
  }

  getPlayerIndex(id: string): number {
    if (!this.canvas) {
      throw new Error("Canvas is not initialized");
    }

    return this.players.findIndex((player) => player.playerInfo.id === id);
  }

  findPlayer(id: string) {
    if (!this.canvas) {
      throw new Error("Canvas is not initialized");
    }

    return this.players.find((player) => player.playerInfo.id === id);
  }

  async updatePlayer(player: Player, newPlayerInfo: PlayerInfo) {
    if (!this.canvas) {
      return false;
    }

    await player.updatePlayerInfo(newPlayerInfo);

    this.canvas.requestRenderAll();

    return true;
  }

  downloadGraphic(filename: string) {
    if (!this.canvas) {
      throw new Error("Canvas is not initialized");
    }

    this.canvas.lowerCanvasEl.toBlob((blob: Blob | null) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "top8.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  setCanvasEditable(editable: boolean) {
    if (!this.canvas) {
      throw new Error("Canvas is not initialized");
    }

    this.canvas.forEachObject((obj) => {
      if (obj.locked) {
        return;
      }

      obj.locked = !editable;
      obj.lockMovementX = !editable;
      obj.lockMovementY = !editable;
      obj.lockScalingX = !editable;
      obj.lockScalingY = !editable;
      obj.lockRotation = !editable;
      obj.hasControls = editable;
    });

    this.canvas.selection = editable;
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }
}
