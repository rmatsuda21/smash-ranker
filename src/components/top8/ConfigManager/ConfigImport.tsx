import { FaFileImport } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { useCanvasStore } from "@/store/canvasStore";
import { DBTemplate } from "@/types/Repository";
import { useFontStore } from "@/store/fontStore";

export const ConfigImport = () => {
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const fontDispatch = useFontStore((state) => state.dispatch);

  const handleImport = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = JSON.parse(event.target?.result as string) as DBTemplate;
          const layout = json.design;
          const selectedFont = json.font;

          if (!layout || !selectedFont) {
            return;
          }

          canvasDispatch({ type: "SET_DESIGN", payload: layout });
          // TODO: LOAD FONT
          fontDispatch({ type: "SET_SELECTED_FONT", payload: selectedFont });
          fileInput.remove();
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  };

  return (
    <Button onClick={handleImport}>
      <FaFileImport />
      Import
    </Button>
  );
};
