import { Button } from "@radix-ui/themes";
// import { LuPlus } from "react-icons/lu";

import { ElementConfigEditor } from "@/components/top8/ElementEditor/ElementConfigEditor/ElementConfigEditor";
import { ElementConfig } from "@/types/top8/LayoutTypes";

type Props = {
  className?: string;
  elements: ElementConfig[];
  selectedElementIndex: number;
  onAddElement: (element: ElementConfig) => void;
  onElementSelect: (index: number) => void;
  onUpdateElement: (element: ElementConfig) => void;
};

export const ElementEditor = ({
  className,
  elements,
  selectedElementIndex,
  // onAddElement,
  onElementSelect,
  onUpdateElement,
}: Props) => {
  const handleClick = (index: number) => {
    onElementSelect(index);
  };

  // const addElement = () => {
  //   onAddElement({
  //     name: "New Element",
  //     type: "text",
  //     text: "Hello",
  //     fill: "#ffff00",
  //     fontSize: 200,
  //     fontWeight: 900,
  //     position: { x: 0, y: 0 },
  //   });
  // };

  return (
    <div className={className}>
      {/* <Button variant="outline" size="2" onClick={addElement}>
        <LuPlus />
        Add Element
      </Button> */}
      <div>
        {elements?.map((element, index) => (
          <Button
            key={`${element.type}-${index}`}
            onClick={() => handleClick(index)}
            variant={index === selectedElementIndex ? "solid" : "outline"}
          >
            {element.name || element.type}
          </Button>
        ))}
      </div>
      {selectedElementIndex !== -1 && elements?.[selectedElementIndex] && (
        <ElementConfigEditor
          element={elements?.[selectedElementIndex]}
          onUpdateElement={onUpdateElement}
        />
      )}
    </div>
  );
};
