import { memo } from "react";

import { ThumbnailElement } from "@/types/thumbnail/ThumbnailDesign";

import { TextNode } from "./TextNode";
import { ImageNode } from "./ImageNode";
import { CharacterNode } from "./CharacterNode";
import { FlagNode } from "./FlagNode";
import { TournamentIconNode } from "./TournamentIconNode";
import { ShapeNode } from "./ShapeNode";
import { GroupNode } from "./GroupNode";

type Props = {
  element: ThumbnailElement;
  draggable: boolean;
};

const ElementNodeComponent = ({ element, draggable }: Props) => {
  switch (element.type) {
    case "text":
      return <TextNode element={element} draggable={draggable} />;
    case "image":
      return <ImageNode element={element} draggable={draggable} />;
    case "character":
      return <CharacterNode element={element} draggable={draggable} />;
    case "flag":
      return <FlagNode element={element} draggable={draggable} />;
    case "tournamentIcon":
      return <TournamentIconNode element={element} draggable={draggable} />;
    case "shape":
      return <ShapeNode element={element} draggable={draggable} />;
    case "group":
      return <GroupNode element={element} draggable={draggable} />;
    default:
      return null;
  }
};

export const ElementNode = memo(ElementNodeComponent);
