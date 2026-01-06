import { useState } from "react";
import { FaGear } from "react-icons/fa6";

import { Spinner } from "@/components/shared/Spinner/Spinner";
import { Button } from "@/components/shared/Button/Button";
import { useTemplateDB } from "@/hooks/useConfigDb";
import { ConfigManagerModal } from "@/components/top8/ConfigManager/ConfigManagerModal/ConfigManagerModal";

export const ConfigSelector = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loading } = useTemplateDB();

  if (loading) return <Spinner size={25} />;

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} tooltip="Config Manager">
        <FaGear />
      </Button>
      <ConfigManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
