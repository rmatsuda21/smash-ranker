import { createContext, useContext } from "react";

export type RecapStoryControls = {
  // Stop the story advancing (and taps navigating) while a slide has
  // something of its own to do, like the globe being explored.
  setLocked: (locked: boolean) => void;
  replay: () => void;
};

export const RecapStoryContext = createContext<RecapStoryControls>({
  setLocked: () => {},
  replay: () => {},
});

export const useRecapStory = () => useContext(RecapStoryContext);
