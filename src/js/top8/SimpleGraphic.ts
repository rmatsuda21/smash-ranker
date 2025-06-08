import { BaseGraphic } from "@/js/top8/Graphic";
import { CanvasConfig } from "@/types/top8/Canvas";
import { Tournament } from "@/types/top8/Tournament";
import { drawSVG } from "@/utils/top8/drawSVG";

export class SimpleGraphic extends BaseGraphic {
  constructor(
    tournament: Tournament,
    canvas: HTMLCanvasElement,
    canvasConfig: CanvasConfig
  ) {
    super(tournament, canvas, canvasConfig);
  }

  async renderGraphic(): Promise<void> {
    const font = new FontFace(
      "Roboto Condensed",
      "url(https://fonts.gstatic.com/s/robotocondensed/v30/ieVl2ZhZI2eCN5jzbjEETS9weq8-19-7DQk6YvNkeg.woff2)"
    );

    await font.load();
    document.fonts.add(font);

    const background = await drawSVG("/assets/top8/theme/wtf/background.svg", {
      hoverCursor: "default",
      selectable: false,
      locked: true,
      width: this.canvas.width,
    });

    this.canvas.add(background);
    this.canvas.renderAll();
  }
}
