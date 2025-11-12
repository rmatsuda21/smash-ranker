export type LayoutConfig = {
  canvasSize: {
    width: number;
    height: number;
  };
  players: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    scale: { x: number; y: number };
  }[];
};
