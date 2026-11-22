import { useLingui } from "@lingui/react";

import { RadioGroup } from "@/components/shared/RadioGroup/RadioGroup";
import { GAMES, RENDER_STYLES } from "@/consts/games";
import { GameId, RenderStyleId } from "@/types/Game";

type Props = {
  game: GameId;
  value: RenderStyleId;
  onChange: (style: RenderStyleId) => void;
  className?: string;
};

// Picks which art the full character renders use. Renders nothing for a
// game with a single style.
export const RenderStyleSwitch = ({
  game,
  value,
  onChange,
  className,
}: Props) => {
  const { _ } = useLingui();
  const styles = GAMES[game].renderStyles;

  if (styles.length < 2) return null;

  return (
    <RadioGroup<RenderStyleId>
      className={className}
      value={value}
      onChange={onChange}
      options={styles.map((style) => ({
        value: style,
        label: _(RENDER_STYLES[style].label),
      }))}
    />
  );
};
