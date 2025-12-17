import { FaFileImport } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { useCanvasStore } from "@/store/canvasStore";
import { DBConfig } from "@/types/ConfigRepository";

export const ConfigImport = () => {
  const dispatch = useCanvasStore((state) => state.dispatch);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);

  const handleImport = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = JSON.parse(event.target?.result as string) as DBConfig;
          const layout = json.layout;
          const selectedFont = json.selectedFont;

          if (!layout || !selectedFont) {
            return;
          }

          dispatch({ type: "SET_LAYOUT", payload: layout });
          canvasDispatch({ type: "SET_SELECTED_FONT", payload: selectedFont });
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
