import { useLingui } from "@lingui/react";

import { RadioGroup } from "@/components/shared/RadioGroup/RadioGroup";
import { GAME_IDS, GAMES } from "@/consts/games";
import { GameId } from "@/types/Game";

type Props = {
  value: GameId;
  onChange: (game: GameId) => void;
  className?: string;
};

// Picks which game's characters a tool works with. Lists every game in the
// registry, so a new game shows up here without touching the callers.
export const GameSwitch = ({ value, onChange, className }: Props) => {
  const { _ } = useLingui();

  return (
    <RadioGroup<GameId>
      className={className}
      value={value}
      onChange={onChange}
      options={GAME_IDS.map((game) => ({
        value: game,
        label: _(GAMES[game].label),
      }))}
    />
  );
};
