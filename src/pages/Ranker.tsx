import { Container } from "@radix-ui/themes";
import { useEffect, useRef } from "react";

export const Ranker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {}, []);

  return (
    <Container>
      <h1>Ranker</h1>
      <p>Welcome to the ranker page!</p>

      <Container>
        <canvas ref={canvasRef}></canvas>
      </Container>
    </Container>
  );
};
