import { Container } from "@radix-ui/themes";
import * as fabric from "fabric";
import { useEffect, useRef } from "react";

import styles from "./ranker.module.scss";

export const Ranker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current!, {
      width: canvasRef.current!.clientWidth,
      height: canvasRef.current!.clientHeight,
      backgroundColor: "black",
    });

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: "blue",
      width: 100,
      height: 100,
      // selectable: false,
    });
    fabricCanvas.add(rect);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  return (
    <Container className={styles.root}>
      <h1>Ranker</h1>
      <p>Welcome to the ranker page!</p>

      <Container className={styles.canvasContainer}>
        <canvas ref={canvasRef}></canvas>
      </Container>
    </Container>
  );
};
