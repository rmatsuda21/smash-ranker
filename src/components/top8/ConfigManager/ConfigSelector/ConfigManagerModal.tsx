import { useState } from "react";
import { FaFileImport } from "react-icons/fa6";

import { Modal } from "@/components/shared/Modal/Modal";
import { useConfigDB } from "@/hooks/useConfigDb";
import { Button } from "@/components/shared/Button/Button";
import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { DBConfig } from "@/types/ConfigRepository";
import { useCanvasStore } from "@/store/canvasStore";
import { fetchFontFamily } from "@/utils/top8/fetchAndMapFonts";

import styles from "./ConfigSelector.module.scss";
import { loadFont } from "@/utils/top8/loadFont";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const ConfigManagerModal = ({ isOpen, onClose }: Props) => {
  const [selectedConfig, setSelectedConfig] = useState<DBConfig | null>(null);
  const { configs, getConfig, addConfig, deleteConfig, clearAll } =
    useConfigDB();
  const layout = useCanvasStore((state) => state.layout);
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const dispatch = useCanvasStore((state) => state.dispatch!);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);

  const handleConfigSelect = async (id: string) => {
    const config = await getConfig(id);
    if (config) {
      setSelectedConfig(config);
    }
  };

  const handleCreateNew = async () => {
    const id = await addConfig({
      name: "New Config!",
      layout: layout,
      selectedFont: selectedFont,
    });

    setTimeout(() => handleConfigSelect(id), 0);
  };

  const handleDelete = async (id: string) => {
    await deleteConfig(id);
    setSelectedConfig(null);
  };

  const handleClearAll = async () => {
    await clearAll();
    setSelectedConfig(null);
  };

  const handleLoad = async (id: string) => {
    const config = await getConfig(id);
    if (config) {
      dispatch({ type: "SET_LAYOUT", payload: config.layout });
      dispatch({ type: "SET_SELECTED_FONT", payload: config.selectedFont });
    }
  };

  const handleImport = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const json = JSON.parse(event.target?.result as string) as DBConfig;
          const layout = json.layout;
          const selectedFont = json.selectedFont;

          if (!layout || !selectedFont) {
            alert("Invalid config!");
            fileInput.remove();
            return;
          }

          addConfig({
            name: "Imported Config",
            layout: layout,
            selectedFont: selectedFont,
          });

          canvasDispatch({ type: "LOAD_FONT", payload: selectedFont });
          const font = await fetchFontFamily(selectedFont);
          await loadFont(font);
          canvasDispatch({ type: "FONT_LOADED", payload: selectedFont });

          dispatch({ type: "SET_LAYOUT", payload: layout });
          dispatch({ type: "SET_SELECTED_FONT", payload: selectedFont });

          fileInput.remove();
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <div>
          <h3>Config Manager</h3>
          <DropDownSelect
            options={configs.map((config) => ({
              id: config.id,
              display: config.name,
              value: config.id,
            }))}
            placeholder="Select Config"
            selectedValue={selectedConfig?.id ?? ""}
            onChange={(values) => handleConfigSelect(values[0].id)}
          />
          <Button onClick={handleCreateNew}>Create New</Button>
          <Button onClick={() => handleLoad(selectedConfig?.id ?? "")}>
            Load
          </Button>
          <Button onClick={() => handleDelete(selectedConfig?.id ?? "")}>
            Delete
          </Button>
          <Button onClick={handleClearAll}>Clear All</Button>
          <Button onClick={handleImport}>
            <FaFileImport />
            Import
          </Button>
        </div>

        <div className={styles.configViewer}>
          {selectedConfig && (
            <pre>{JSON.stringify(selectedConfig, null, 2)}</pre>
          )}
        </div>
      </div>
    </Modal>
  );
};
