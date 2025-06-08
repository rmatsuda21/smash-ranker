import { useEffect, useRef, useState } from "react";
import { Spinner } from "@radix-ui/themes";

import { Result } from "@/types/top8/Result";
import styles from "@/components/styles/Top8/Canvas.module.scss";
import { Graphic } from "@/js/top8/Graphic";
import { Tournament } from "@/types/top8/Tournament";
import { CanvasEvents } from "@/types/top8/Canvas";
import { SimpleGraphic } from "@/js/top8/SimpleGraphic";

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 675;

export const Canvas = ({
  setGraphic,
  result,
  canvasConfig = { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT },
}: {
  setGraphic: (canvas: Graphic) => void;
  onPlayerSelected: CanvasEvents["onPlayerSelected"];
  result: Result;
  canvasConfig?: {
    width: number;
    height: number;
  };
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const graphic = new SimpleGraphic(
      { result } as Tournament,
      canvasRef.current!,
      {
        width: canvasConfig.width,
        height: canvasConfig.height,
        backgroundColor: "black",
      }
    );

    graphic.renderGraphic().then(() => setLoading(false));
    setGraphic(graphic);

    return () => {
      graphic.dispose();
    };
  }, [setGraphic]);

  return (
    <div className={styles.root}>
      <div className={styles.loader}>{loading && <Spinner size="3" />}</div>
      <canvas ref={canvasRef} />
    </div>
  );
};
