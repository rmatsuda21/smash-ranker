import { ElementConfig } from "@/types/top8/LayoutTypes";
import { TextConfigEditor } from "@/components/top8/ElementEditor/TextConfigEditor";
import { ImageConfigEditor } from "@/components/top8/ElementEditor/ImageConfigEditor";

type Props = {
  element: ElementConfig;
  onUpdateElement: (element: ElementConfig) => void;
};

export const ElementConfigEditor = ({ element, onUpdateElement }: Props) => {
  switch (element.type) {
    case "text":
    case "smartText":
      return (
        <TextConfigEditor element={element} onUpdateElement={onUpdateElement} />
      );
    case "image":
      return (
        <ImageConfigEditor
          element={element}
          onUpdateElement={onUpdateElement}
        />
      );
    default:
      return null;
  }
};
