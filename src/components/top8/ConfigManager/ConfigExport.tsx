import { FaFileExport } from "react-icons/fa6";

import { useCanvasStore } from "@/store/canvasStore";
import { Button } from "@/components/shared/Button/Button";

export const ConfigExport = () => {
  const config = useCanvasStore((state) => state.layout);

  const handleExport = () => {
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
