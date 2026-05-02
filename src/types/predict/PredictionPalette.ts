export type PredictionPalette = {
  bgGradientStart: string;
  bgGradientEnd: string;
  accent: string;
  accentRowBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFooter: string;
  borderSubtle: string;
};

export const DEFAULT_PREDICTION_PALETTE: PredictionPalette = {
  bgGradientStart: "#1e1e3a",
  bgGradientEnd: "#14142a",
  accent: "#7c5cbf",
  accentRowBg: "rgba(124, 92, 191, 0.28)",
  textPrimary: "#ffffff",
  textSecondary: "#e8e8f0",
  textMuted: "#8888aa",
  textFooter: "#4a4a60",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
};
