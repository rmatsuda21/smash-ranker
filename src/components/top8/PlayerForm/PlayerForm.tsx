import { useEffect } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { PlayerInfo } from "@/types/top8/Result";
import { useForm } from "react-hook-form";

type Props = {
  selectedPlayer: PlayerInfo | null;
  updatePlayer: (player: PlayerInfo) => void;
};

export const PlayerForm = ({ selectedPlayer, updatePlayer }: Props) => {
  const { register, handleSubmit, reset } = useForm<PlayerInfo>({
    defaultValues: selectedPlayer || undefined,
  });

  useEffect(() => {
    if (selectedPlayer) {
      reset(selectedPlayer);
    }
  }, [selectedPlayer, reset]);

  const onSubmit = (data: PlayerInfo) => {
    updatePlayer(data);
  };

  if (!selectedPlayer) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField.Root
        type="text"
        {...register("name")}
        placeholder="Player Name"
      />
      <Button type="submit">Save</Button>
    </form>
  );
};
