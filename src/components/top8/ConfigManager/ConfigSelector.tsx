import { useState } from "react";
import { Spinner } from "@radix-ui/themes";
import { FaGear } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { useConfigDB } from "@/hooks/useConfigDb";
import { Modal } from "@/components/shared/Modal/Modal";
// import { simpleLayout } from "@/layouts/simple";

export const ConfigSelector = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loading } = useConfigDB();

  if (loading) return <Spinner />;

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <FaGear /> Manage
      </Button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div>Config Manager</div>
      </Modal>
    </>
  );
};
