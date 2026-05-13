import { createContext, useContext } from "react";

export type RenderMode = "default" | "mobile";

export const RenderModeContext = createContext<RenderMode>("default");

export const useRenderMode = (): RenderMode => useContext(RenderModeContext);
