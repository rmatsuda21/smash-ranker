import { useMemo, useState } from "react";
import { FaFileImport } from "react-icons/fa6";

import { Modal } from "@/components/shared/Modal/Modal";
import { useConfigDB } from "@/hooks/useConfigDb";
import { Button } from "@/components/shared/Button/Button";
import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { DBConfig } from "@/types/Repository";
import { useFontStore } from "@/store/fontStore";
import { useCanvasStore } from "@/store/canvasStore";
import { fetchFontFamily } from "@/utils/top8/fetchAndMapFonts";
import { loadFont } from "@/utils/top8/loadFont";
import { simpleLayout } from "@/layouts/simple";
import { squaresLayout } from "@/layouts/squares";

import styles from "./ConfigManagerModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const defaultConfigs: DBConfig[] = [
  {
    id: "default-simple",
    name: "Simple Config",
    layout: simpleLayout,
    selectedFont: "Noto Sans JP",
  },
  {
    id: "default-squares",
    name: "Squares Config",
    layout: squaresLayout,
    selectedFont: "Noto Sans JP",
  },
];

export const ConfigManagerModal = ({ isOpen, onClose }: Props) => {
  const [selectedConfig, setSelectedConfig] = useState<DBConfig | null>(null);
  const { configs, getConfig, addConfig, deleteConfig, clearAll } =
    useConfigDB();

  const layout = useCanvasStore((state) => state.layout);
  const selectedFont = useFontStore((state) => state.selectedFont);
  const dispatch = useCanvasStore((state) => state.dispatch!);
  const fontDispatch = useFontStore((state) => state.dispatch);

  const handleConfigSelect = async (id: string) => {
    let config: DBConfig | undefined;
    if (defaultConfigs.some((c) => c.id === id)) {
      config = defaultConfigs.find((c) => c.id === id)!;
    } else {
      config = await getConfig(id);
    }

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
    let config: DBConfig | undefined;
    if (defaultConfigs.some((config) => config.id === id)) {
      config = defaultConfigs.find((config) => config.id === id)!;
    } else {
      config = await getConfig(id);
    }

    if (config) {
      dispatch({ type: "SET_LAYOUT", payload: config.layout });
      fontDispatch({ type: "SET_SELECTED_FONT", payload: config.selectedFont });
    }

    onClose();
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

          fontDispatch({ type: "LOAD_FONT", payload: selectedFont });
          const font = await fetchFontFamily(selectedFont);
          await loadFont(font);
          fontDispatch({ type: "LOAD_FONT_SUCCESS", payload: font });

          dispatch({ type: "SET_LAYOUT", payload: layout });
          fontDispatch({ type: "SET_SELECTED_FONT", payload: selectedFont });

          fileInput.remove();
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  };

  const dropDownOptions = useMemo(() => {
    return [...defaultConfigs, ...configs].map((config) => ({
      id: config.id,
      display: config.name,
      value: config.id,
    }));
  }, [configs]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <div className={styles.body}>
          <h3>Config Manager</h3>
          <DropDownSelect
            options={dropDownOptions}
            placeholder="Select Config"
            selectedValue={selectedConfig?.id ?? ""}
            onChange={(id) => handleConfigSelect(id)}
          />
          <Button onClick={handleCreateNew}>Save Current Config</Button>
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
