import { FaFileExport } from "react-icons/fa6";

import { useCanvasStore } from "@/store/canvasStore";
import { Button } from "@/components/shared/Button/Button";
import { DBConfig } from "@/types/Repository";
import { useFontStore } from "@/store/fontStore";

export const ConfigExport = () => {
  const layout = useCanvasStore((state) => state.design);
  const selectedFont = useFontStore((state) => state.selectedFont);

  const handleExport = async () => {
    const config: Omit<DBConfig, "id"> = {
      name: "Exported Config",
      layout: layout,
      selectedFont: selectedFont,
    };
    const json = JSON.stringify(config, null, 2);

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "config.json",
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "config.json";
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Button onClick={handleExport} tooltip="Export">
      <FaFileExport />
    </Button>
  );
};
