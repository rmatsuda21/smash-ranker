import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import "@fontsource/big-shoulders-display/latin-800";
import "@fontsource/big-shoulders-display/latin-900";

import { PlayerCardModal } from "@/components/user/PlayerCardModal/PlayerCardModal";
import type { AuthUser } from "@/types/user/AuthUser";
import type { UserEvent } from "@/types/user/UserEvent";
import type { UserSet } from "@/types/user/UserSet";
import { logWarning } from "@/utils/observability/log";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";
import { computeCareerStats, computeSetStats } from "@/utils/user/careerStats";
import {
  buildPlayerCardData,
  CARD_HEIGHT,
  CARD_WIDTH,
  drawPlayerCard,
  loadPlayerCardAssets,
  type PlayerCardAssets,
} from "@/utils/user/playerCard";

import styles from "./PlayerCardLauncher.module.scss";

type Props = {
  user: AuthUser;
  events: UserEvent[];
  sets: UserSet[];
  className?: string;
};

// The way in to the player card is the card itself: a small copy of it in
// the profile header, catching the light, that opens the full one. Loaded on
// demand (once the stats it is drawn from are in), so the painter and the
// card's display font stay out of the profile page's bundle.
export const PlayerCardLauncher = ({
  user,
  events,
  sets,
  className,
}: Props) => {
  const { _ } = useLingui();
  const [open, setOpen] = useState(false);

  const data = useMemo(
    () =>
      buildPlayerCardData(
        user,
        computeCareerStats(events),
        computeSetStats(sets, isKnownCharacter),
        {
          events: _(msg`Events`),
          wins: _(msg`Wins`),
          top8: _(msg`Top 8`),
          sets: _(msg`Sets`),
          top3: _(msg`Top 3`),
        },
      ),
    [user, events, sets, _],
  );

  const [assets, setAssets] = useState<PlayerCardAssets | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadPlayerCardAssets(data)
      .then((loaded) => {
        if (!cancelled) setAssets(loaded);
      })
      .catch((err: unknown) => {
        logWarning("player card assets failed", {
          area: "user",
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !assets) return;
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    drawPlayerCard(ctx, data, assets);
  }, [data, assets]);

  // Same box as the button, so the header does not move when the art lands.
  if (!assets) {
    return <span className={className} aria-hidden="true" />;
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={_(msg`Open your player card`)}
        title={_(msg`Player card`)}
        onClick={() => setOpen(true)}
      >
        <span className={styles.card}>
          <canvas
            ref={canvasRef}
            className={styles.face}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            aria-hidden="true"
          />
          <span className={styles.shine} />
        </span>
      </button>
      {open && (
        <PlayerCardModal
          data={data}
          assets={assets}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};
