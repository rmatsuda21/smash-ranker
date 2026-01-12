import { useState } from "react";
import cn from "classnames";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useFetchResult } from "@/hooks/top8/useFetchResult";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { COOKIES } from "@/consts/cookies";
import { useConfirmation } from "@/hooks/useConfirmation";

import styles from "./TournamentLoader.module.scss";

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
  const [url, setUrl] = useState(
    "https://smash.gg/tournament/no-caps-115-msc-1400/event/ultimate-singles"
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
      alert("Invalid tournament URL!");
      setError(true);
      return;
    }

    fetchResult(matchedUrl, 16);
  };

  const { confirm: confirmLoad, ConfirmationDialog: LoadConfirmation } =
    useConfirmation(loadTournament, {
      title: "Load Tournament?",
      description:
        "Any current player and tournament data will be overwritten.",
      cookieName: COOKIES.NEEDS_TOURNAMENT_LOAD_CONFIRMATION,
    });

  return (
    <div className={cn(styles.tournamentLoader, className)}>
      <div className={styles.inputContainer}>
        <Input
          className={cn({ [styles.error]: error })}
          label="Tournament URL"
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
          Load
        </Button>
      </div>

      <LoadConfirmation />
    </div>
  );
};
