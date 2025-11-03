import { useEffect, useState } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { PlayerInfo } from "@/types/top8/Result";

type Props = {
  selectedPlayer: PlayerInfo | null;
  updatePlayer: (player: PlayerInfo) => void;
};

export const PlayerForm = ({ selectedPlayer, updatePlayer }: Props) => {
  const [formData, setFormData] = useState<PlayerInfo | null>(null);

  useEffect(() => {
    setFormData(selectedPlayer);
  }, [selectedPlayer]);

  const handleChange = <K extends keyof PlayerInfo>(
    field: K,
    value: PlayerInfo[K]
  ) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleSave = () => {
    if (formData) {
      updatePlayer(formData);
    }
  };

  if (!formData) return null;

  return (
    <div>
      <TextField.Root
        type="text"
        name="name"
        value={formData.name}
        onChange={(event) => {
          handleChange("name", event.currentTarget.value);
        }}
        placeholder="Player Name"
      />

      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};
