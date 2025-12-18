import { useState } from "react";
import { Spinner } from "@radix-ui/themes";
import { FaGear } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { useConfigDB } from "@/hooks/useConfigDb";
import { ConfigManagerModal } from "@/components/top8/ConfigManager/ConfigManagerModal/ConfigManagerModal";

export const ConfigSelector = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loading } = useConfigDB();

  if (loading) return <Spinner />;

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <FaGear /> Manage
      </Button>
      <ConfigManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
