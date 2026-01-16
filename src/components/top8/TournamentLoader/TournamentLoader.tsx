import { useState } from "react";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaCircleInfo } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useFetchResult } from "@/hooks/top8/useFetchResult";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { COOKIES } from "@/consts/cookies";
import { useConfirmation } from "@/hooks/useConfirmation";

import styles from "./TournamentLoader.module.scss";
import { Trans } from "@lingui/react/macro";

const urlToSlug = (url: string) => {
  const match = url.match(/tournament\/([^/]+)\/event\/([^/]+)/);
  if (match) {
    return `tournament/${match[1]}/event/${match[2]}`;
  }

  return null;

  // return (
  //   // "tournament/genesis-9-1/event/ultimate-singles"
  //   // "tournament/sp12-umeburasp12/event/singles"
  //   // "tournament/no-caps-115-msc-1400/event/ultimate-singles"
  //   "tournament/smash-sans-fronti-res-271/event/smash-ultimate-singles"
  //   // "tournament/the-buddbuds-local-15/event/ultimate-singles"
  //   // "tournament/coffee-break-11-0/event/ultimate-singles"
  // );
};

type Props = {
  className?: string;
};

export const TournamentLoader = ({ className }: Props) => {
  const { _ } = useLingui();
  const [url, setUrl] = useState(
    // "https://smash.gg/tournament/no-caps-115-msc-1400/event/ultimate-singles"
    ""
  );
  const [error, setError] = useState<boolean>(false);

  const isFetching = usePlayerStore((state) => state.fetching);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const { fetchResult } = useFetchResult();

  const loadTournament = () => {
    playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

    const matchedUrl = urlToSlug(url);

    if (!matchedUrl) {
      alert(_(msg`Invalid tournament URL!`));
      setError(true);
      return;
    }

    fetchResult(matchedUrl, 24);
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
          <Trans>Enter the start.gg event URL</Trans>
          <br />
          <Trans>(https://start.gg/tournament/[name]/event/[event])</Trans>
        </pre>
      </span>
    </span>
  );

  return (
    <div className={cn(styles.tournamentLoader, className)}>
      <div className={styles.inputContainer}>
        <Input
          className={cn({ [styles.error]: error })}
          label={urlLabel}
          id="tournament-url"
          name="tournament-url"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.currentTarget.value);
            setError(false);
          }}
        />
        <Button loading={isFetching} onClick={confirmLoad}>
          {_(msg`Load`)}
        </Button>
      </div>

      <LoadConfirmation />
    </div>
  );
};
