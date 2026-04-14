export interface GradientColorStop {
  /** Position along the gradient line (0–1) */
  position: number;
  /** Hex, rgba, or palette key */
  color: string;
}

export interface LinearGradientConfig {
  type: "linear";
  /** CSS convention: 0° = bottom→top, 90° = left→right, 180° = top→bottom */
  angle: number;
  colorStops: GradientColorStop[];
}

export interface RadialGradientConfig {
  type: "radial";
  /** Normalized center (0–1), defaults to { x: 0.5, y: 0.5 } */
  center?: { x: number; y: number };
  colorStops: GradientColorStop[];
}

export interface AngularGradientConfig {
  type: "angular";
  /** Start angle in degrees (CSS convention), defaults to 0 */
  angle?: number;
  /** Normalized center (0–1), defaults to { x: 0.5, y: 0.5 } */
  center?: { x: number; y: number };
  colorStops: GradientColorStop[];
}

export type GradientConfig =
  | LinearGradientConfig
  | RadialGradientConfig
  | AngularGradientConfig;
