// import { useState } from "react";
import { Spinner } from "@radix-ui/themes";

import { Button } from "@/components/shared/Button/Button";
import { useConfigDB } from "@/hooks/useConfigDb";
import { simpleLayout } from "@/layouts/simple";
// import { Modal } from "@/components/shared/Modal/Modal";

export const ConfigSelector = () => {
  // const [isModalOpen, setIsModalOpen] = useState(true);
  const { configs, loading, addConfig } = useConfigDB();

  if (loading) return <Spinner />;

  return (
    <div>
      {configs.map((config) => (
        <div key={config.id}>{config.name}</div>
      ))}
      <Button
        onClick={() => {
          addConfig({
            name: "New Config",
            layout: simpleLayout,
            selectedFont: "Arial",
          });
        }}
      >
        New Config
      </Button>
      {/* <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div>Config Selector</div>
      </Modal> */}
    </div>
  );
};
