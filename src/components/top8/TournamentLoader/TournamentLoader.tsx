import { useMemo, useState } from "react";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaCircleInfo } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useFetchResult } from "@/hooks/top8/useFetchResult";
import { useFetchChallonge } from "@/hooks/top8/useFetchChallonge";
import { useFetchTonamel } from "@/hooks/top8/useFetchTonamel";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { COOKIES } from "@/consts/cookies";
import { useConfirmation } from "@/hooks/useConfirmation";
import { detectPlatformAndSlug } from "@/consts/platforms";

import styles from "./TournamentLoader.module.scss";
import { Trans } from "@lingui/react/macro";

type Props = {
  className?: string;
};

export const TournamentLoader = ({ className }: Props) => {
  const { _ } = useLingui();
  const [url, setUrl] = useState("");

  const isFetching = usePlayerStore((state) => state.fetching);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const { fetchResult } = useFetchResult();
  const { fetchChallonge } = useFetchChallonge();
  const { fetchTonamel } = useFetchTonamel();

  const detected = useMemo(() => detectPlatformAndSlug(url), [url]);
  const isValid = detected !== null;
  const hasInput = url.trim().length > 0;

  const loadTournament = () => {
    if (!detected) return;

    playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

    if (detected.platform === "startgg") {
      fetchResult(detected.slug, 24);
    } else if (detected.platform === "challonge") {
      fetchChallonge(detected.slug, 24);
    } else if (detected.platform === "tonamel") {
      fetchTonamel(detected.slug, 24);
    }
  };

  const { confirm: confirmLoad, ConfirmationDialog: LoadConfirmation } =
    useConfirmation(loadTournament, {
      title: _(msg`Load Tournament?`),
      description: _(
        msg`Any current player and tournament data will be overwritten.`
      ),
      cookieName: COOKIES.NEEDS_TOURNAMENT_LOAD_CONFIRMATION,
    });

  const urlLabel = (
    <span className={styles.labelWithInfo}>
      <Trans>Tournament URL</Trans>
      <span className={styles.infoButton} aria-label={_(msg`Show help`)}>
        <FaCircleInfo />
        <pre className={styles.tooltip}>
          <Trans>Enter a start.gg, Challonge, or Tonamel event URL</Trans>
          <br />
          <Trans>(https://start.gg/tournament/[name]/event/[event])</Trans>
          <br />
          <Trans>(https://challonge.com/[tournament])</Trans>
          <br />
          <Trans>(https://tonamel.com/competition/[slug])</Trans>
        </pre>
      </span>
    </span>
  );

  return (
    <div className={cn(styles.tournamentLoader, className)}>
      <div className={styles.inputContainer}>
        <Input
          className={cn({
            [styles.valid]: hasInput && isValid,
            [styles.error]: hasInput && !isValid,
          })}
          label={urlLabel}
          id="tournament-url"
          name="tournament-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
        />
        <Button
          loading={isFetching}
          disabled={!isValid}
          onClick={confirmLoad}
        >
          {_(msg`Load`)}
        </Button>
      </div>

      <LoadConfirmation />
    </div>
  );
};
