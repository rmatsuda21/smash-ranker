import { ElementConfig } from "@/types/top8/LayoutTypes";
import { TextConfigEditor } from "@/components/top8/ElementEditor/TextConfigEditor";
import { ImageConfigEditor } from "@/components/top8/ElementEditor/ImageConfigEditor";

type Props = {
  element: ElementConfig;
  index: number;
};

export const ConfigEditor = ({ element, index }: Props) => {
  switch (element.type) {
    case "text":
      return <TextConfigEditor element={element} index={index} />;
    case "image":
      return <ImageConfigEditor element={element} index={index} />;
    default:
      return null;
  }
};
