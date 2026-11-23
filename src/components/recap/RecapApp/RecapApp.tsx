import { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLocation } from "wouter";
import "@fontsource/big-shoulders-display/latin-800";
import "@fontsource/big-shoulders-display/latin-900";

import {
  RecapStory,
  type RecapSlideDefinition,
} from "@/components/recap/RecapStory/RecapStory";
import { BestRunSlide } from "@/components/recap/slides/BestRunSlide";
import { CoverSlide } from "@/components/recap/slides/CoverSlide";
import { GrindSlide } from "@/components/recap/slides/GrindSlide";
import { IntroSlide } from "@/components/recap/slides/IntroSlide";
import { MainSlide } from "@/components/recap/slides/MainSlide";
import { RecordSlide } from "@/components/recap/slides/RecordSlide";
import { RivalSlide } from "@/components/recap/slides/RivalSlide";
import { RoadSlide } from "@/components/recap/slides/RoadSlide";
import { TypeSlide } from "@/components/recap/slides/TypeSlide";
import { UpsetSlide } from "@/components/recap/slides/UpsetSlide";
import { DEFAULT_GAME } from "@/consts/games";
import { RECAP_YEAR } from "@/consts/recap/recap";
import { useRecap } from "@/hooks/recap/useRecap";
import { useRecapCatalog } from "@/hooks/recap/useRecapCatalog";
import { useUserGameCounts } from "@/hooks/user/useUserGameCounts";
import { useAuthUser } from "@/store/authStore";
import type { Recap, RecapPlayer } from "@/types/recap/Recap";
import { logEvent, logWarning } from "@/utils/observability/log";
import { fetchRecapPlayer } from "@/utils/recap/fetchRecapPlayer";
import { loadRecapGlobe } from "@/utils/recap/loadGlobe";
import { pickProfileGame } from "@/utils/user/profileGame";

import styles from "../recap.module.scss";

// The slides this player has something to show on, in story order.
const slidesFor = (recap: Recap): RecapSlideDefinition[] => {
  const all: (RecapSlideDefinition | false)[] = [
    {
      id: "intro",
      ground: "ink",
      wipe: "slash",
      render: () => <IntroSlide recap={recap} />,
    },
    {
      id: "grind",
      ground: "blue",
      wipe: "slash",
      render: () => <GrindSlide recap={recap} />,
    },
    recap.characters.length > 0 && {
      id: "main",
      ground: "yellow",
      wipe: "iris",
      render: () => <MainSlide recap={recap} />,
    },
    recap.setCount > 0 && {
      id: "record",
      ground: "ink",
      wipe: "shutter",
      render: () => <RecordSlide recap={recap} />,
    },
    recap.bestRun !== null && {
      id: "best",
      ground: "pink",
      wipe: "drop",
      render: () => <BestRunSlide recap={recap} />,
    },
    recap.upsets.length > 0 && {
      id: "upset",
      ground: "green",
      wipe: "slash",
      render: () => <UpsetSlide recap={recap} />,
    },
    recap.rival !== null &&
      recap.rivalSets.length > 1 && {
        id: "rival",
        ground: "blue",
        wipe: "shutter",
        render: () => <RivalSlide recap={recap} />,
      },
    recap.cities.length > 0 && {
      id: "road",
      ground: "ink",
      wipe: "drop",
      render: () => <RoadSlide recap={recap} />,
    },
    {
      id: "type",
      ground: "blue",
      wipe: "iris",
      render: () => <TypeSlide recap={recap} />,
    },
    {
      id: "cover",
      ground: "ink",
      wipe: "slash",
      render: () => <CoverSlide recap={recap} />,
    },
  ];
  return all.filter((slide): slide is RecapSlideDefinition => slide !== false);
};

// In development, `?u=<discriminator>` shows any player's recap (with the
// app's own token), to test against accounts of every size.
const devSlug = (): string | null => {
  if (!import.meta.env.DEV) return null;
  const discriminator = new URLSearchParams(window.location.search).get("u");
  return discriminator ? `user/${discriminator}` : null;
};

// In development, `?s=<slide id>` opens on one slide and holds it there.
const devSlide = (): string | null =>
  import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("s")
    : null;

const useLookedUpPlayer = (slug: string | null) => {
  const [result, setResult] = useState<{
    slug: string;
    player: RecapPlayer | null;
  }>();
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchRecapPlayer(slug)
      .then((player) => {
        if (!cancelled) setResult({ slug, player });
      })
      .catch((err: unknown) => {
        logWarning("recap player lookup failed", {
          area: "recap",
          error: err instanceof Error ? err.message : String(err),
        });
        if (!cancelled) setResult({ slug, player: null });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return result?.slug === slug ? result : undefined;
};

const Status = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.phone} style={{ cursor: "default" }}>
    <section className={cn(styles.slide, styles.gInk, styles.status)}>
      {children}
    </section>
  </div>
);

// The yearly recap: loads the logged-in player's year, then plays it as a
// story.
export const RecapApp = () => {
  const [, navigate] = useLocation();
  const user = useAuthUser();
  const [otherSlug] = useState(devSlug);
  const lookedUp = useLookedUpPlayer(otherSlug);
  const gameCounts = useUserGameCounts();
  const catalogReady = useRecapCatalog();

  const player = useMemo((): RecapPlayer | null => {
    if (otherSlug) return lookedUp?.player ?? null;
    if (!user?.playerId) return null;
    return {
      userId: user.id,
      playerId: user.playerId,
      slug: user.slug,
      tag: user.gamerTag,
      avatarUrl: user.avatarUrl,
    };
  }, [otherSlug, lookedUp, user]);
  // The recap is about one game: the one the profile opens on.
  const game = otherSlug ? DEFAULT_GAME : pickProfileGame(gameCounts);
  const gameKnown = otherSlug !== null || gameCounts !== null;

  const { status, progress, recap } = useRecap(
    gameKnown ? player : null,
    game,
    RECAP_YEAR,
  );
  const slides = useMemo(() => (recap ? slidesFor(recap) : []), [recap]);
  const close = () => navigate(user ? "/me" : "/");

  // Fetched while the year loads, so the globe slide never waits for them.
  // A failure here is reported by the globe itself when it asks again.
  const hasPlayer = player !== null;
  useEffect(() => {
    if (hasPlayer) loadRecapGlobe().catch(() => {});
  }, [hasPlayer]);
  const year = RECAP_YEAR;

  useEffect(() => {
    if (recap) logEvent("recap_open", { game, slide_count: slides.length });
    // Once per recap shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recap]);

  let body: React.ReactNode;
  if (!otherSlug && !user) {
    body = (
      <Status>
        <h1>
          <Trans>Recap {year}</Trans>
        </h1>
        <p>
          <Trans>Log in with start.gg to see your year in bracket.</Trans>
        </p>
        <button type="button" className={styles.action} onClick={close}>
          <Trans>Go to the home page</Trans>
        </button>
      </Status>
    );
  } else if (status === "error" || (lookedUp && !lookedUp.player)) {
    body = (
      <Status>
        <h1>
          <Trans>That didn't load</Trans>
        </h1>
        <p>
          <Trans>start.gg did not answer. Try again in a minute.</Trans>
        </p>
        <button
          type="button"
          className={styles.action}
          onClick={() => window.location.reload()}
        >
          <Trans>Try again</Trans>
        </button>
      </Status>
    );
  } else if (!recap) {
    body = (
      <Status>
        <h1>
          <Trans>Counting your sets</Trans>
        </h1>
        <div className={styles.meter}>
          <b style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p>
          <Trans>Reading every bracket you entered in {year}.</Trans>
        </p>
      </Status>
    );
  } else if (recap.tournaments === 0) {
    body = (
      <Status>
        <h1>
          <Trans>Nothing yet</Trans>
        </h1>
        <p>
          <Trans>
            No tournaments on start.gg for {year}. Enter one and your recap
            starts here.
          </Trans>
        </p>
        <button type="button" className={styles.action} onClick={close}>
          <Trans>Back</Trans>
        </button>
      </Status>
    );
  } else {
    body = (
      <RecapStory
        slides={slides}
        onClose={close}
        holdOn={devSlide()}
        onSlide={(id, index) => {
          if (index === slides.length - 1) {
            logEvent("recap_finish", { game, slide_id: id });
          }
        }}
      />
    );
  }

  // The year loads in the meantime; only the words wait for their catalog.
  return <div className={styles.root}>{catalogReady ? body : null}</div>;
};
