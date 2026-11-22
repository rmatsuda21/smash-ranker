import { useLingui } from "@lingui/react";

import { RadioGroup } from "@/components/shared/RadioGroup/RadioGroup";
import { GAME_IDS, GAMES } from "@/consts/games";
import { GameId } from "@/types/Game";

type Props = {
  value: GameId;
  onChange: (game: GameId) => void;
  // The games to offer, when not all of them (in registry order).
  games?: GameId[];
  className?: string;
};

// Picks which game's characters a tool works with. Lists every game in the
// registry, so a new game shows up here without touching the callers.
export const GameSwitch = ({
  value,
  onChange,
  games = GAME_IDS,
  className,
}: Props) => {
  const { _ } = useLingui();

  return (
    <RadioGroup<GameId>
      className={className}
      value={value}
      onChange={onChange}
      options={games.map((game) => ({
        value: game,
        label: _(GAMES[game].label),
      }))}
    />
  );
};
