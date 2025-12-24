import { FaFileExport } from "react-icons/fa6";

import { useCanvasStore } from "@/store/canvasStore";
import { Button } from "@/components/shared/Button/Button";
import { DBConfig } from "@/types/Repository";
import { useFontStore } from "@/store/fontStore";

export const ConfigExport = () => {
  const layout = useCanvasStore((state) => state.layout);
  const selectedFont = useFontStore((state) => state.selectedFont);

  const handleExport = () => {
    const config: Omit<DBConfig, "id"> = {
      name: "Exported Config",
      layout: layout,
      selectedFont: selectedFont,
    };
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "config.json";
    link.click();
  };

  return (
    <Button onClick={handleExport}>
      <FaFileExport />
      Export
    </Button>
  );
};
