import { useMemo, useState } from "react";
import { FaFileImport } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { useTemplateDB } from "@/hooks/useConfigDb";
import { useConfirmation } from "@/hooks/useConfirmation";
import { Button } from "@/components/shared/Button/Button";
import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { DBTemplate } from "@/types/Repository";
import { useFontStore } from "@/store/fontStore";
import { useCanvasStore } from "@/store/canvasStore";
import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";

import styles from "./ConfigManagerModal.module.scss";
import { COOKIES } from "@/consts/cookies";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const defaultConfigs: DBTemplate[] = [
  {
    id: "default-simple",
    name: "Simple Config",
    design: top8erDesign,
    font: "Noto Sans JP",
  },
  {
    id: "default-squares",
    name: "Squares Config",
    design: squaresDesign,
    font: "Noto Sans JP",
  },
];

export const ConfigManagerModal = ({ isOpen, onClose }: Props) => {
  const { _ } = useLingui();
  const [selectedConfig, setSelectedConfig] = useState<DBTemplate | null>(null);
  const {
    templates: configs,
    getTemplateWithId: getConfig,
    addTemplate: addConfig,
    deleteTemplate: deleteConfig,
    clearAll,
  } = useTemplateDB();

  const layout = useCanvasStore((state) => state.design);
  const selectedFont = useFontStore((state) => state.selectedFont);
  const dispatch = useCanvasStore((state) => state.dispatch!);
  const fontDispatch = useFontStore((state) => state.dispatch);

  const handleConfigSelect = async (id: string) => {
    let config: DBTemplate | undefined;
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
      design: layout,
      font: selectedFont,
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
    let config: DBTemplate | undefined;
    if (defaultConfigs.some((config) => config.id === id)) {
      config = defaultConfigs.find((config) => config.id === id)!;
    } else {
      config = await getConfig(id);
    }

    if (config) {
      dispatch({ type: "SET_DESIGN", payload: config.design });
      fontDispatch({
        type: "SET_SELECTED_FONT",
        payload: config.font,
      });
    }

    onClose();
  };

  const { confirm: confirmDelete, ConfirmationDialog: DeleteConfirmation } =
    useConfirmation(handleDelete, {
      title: _(msg`Delete Config: <0>${selectedConfig?.name ?? ""}</0>`),
      description: _(
        msg`Are you sure you want to delete this config? This action cannot be undone.`
      ),
      cookieName: COOKIES.DELETE_CONFIG,
    });

  const {
    confirm: confirmDeleteAll,
    ConfirmationDialog: ClearAllConfirmation,
  } = useConfirmation(handleClearAll, {
    title: _(msg`Delete All Configs`),
    description: _(
      msg`Are you sure you want to delete all saved configs? This action cannot be undone.`
    ),
    cookieName: COOKIES.DELETE_ALL_CONFIGS,
  });

  const { confirm: confirmLoad, ConfirmationDialog: LoadConfirmation } =
    useConfirmation(handleLoad, {
      title: _(msg`Load Config`),
      description: _(
        msg`Are you sure you want to load this config? This action will overwrite the current config.`
      ),
      cookieName: COOKIES.LOAD_CONFIG,
    });

  const handleImport = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const json = JSON.parse(event.target?.result as string) as DBTemplate;
          const layout = json.design;
          const selectedFont = json.font;

          if (!layout || !selectedFont) {
            alert("Invalid config!");
            fileInput.remove();
            return;
          }

          addConfig({
            name: "Imported Config",
            design: layout,
            font: selectedFont,
          });

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
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className={styles.modal}>
          <div className={styles.body}>
            <h3>
              <Trans>Config Manager</Trans>
            </h3>
            <DropDownSelect
              options={dropDownOptions}
              placeholder={_(msg`Select Config`)}
              selectedValue={selectedConfig?.id ?? ""}
              onChange={(id) => handleConfigSelect(id)}
            />
            <Button onClick={handleCreateNew}>
              <Trans>Save Current Config</Trans>
            </Button>
            <Button onClick={() => confirmLoad(selectedConfig?.id ?? "")}>
              <Trans>Load</Trans>
            </Button>
            <Button
              disabled={!selectedConfig}
              onClick={() => confirmDelete(selectedConfig?.id ?? "")}
            >
              <Trans>Delete</Trans>
            </Button>
            <Button
              disabled={configs.length === 0}
              onClick={() => confirmDeleteAll()}
            >
              <Trans>Delete All</Trans>
            </Button>
            <Button onClick={handleImport}>
              <FaFileImport />
              <Trans>Import</Trans>
            </Button>
          </div>

          <div className={styles.configViewer}>
            {selectedConfig && (
              <pre>{JSON.stringify(selectedConfig, null, 2)}</pre>
            )}
          </div>
        </div>
      </Modal>

      <DeleteConfirmation />
      <ClearAllConfirmation />
      <LoadConfirmation />
    </>
  );
};
