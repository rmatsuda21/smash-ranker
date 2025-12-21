import Cookies from "js-cookie";
import { useState } from "react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useFetchResult } from "@/hooks/top8/useFetchResult";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";
import { COOKIES } from "@/consts/cookies";

import styles from "./TournamentLoader.module.scss";

const urlToSlug = (url: string) => {
  const match = url.match(/tournament\/([^/]+)\/event\/([^/]+)/);
  if (match) {
    return `tournament/${match[1]}/event/${match[2]}`;
  }

  return (
    // "tournament/genesis-9-1/event/ultimate-singles"
    "tournament/sp12-umeburasp12/event/singles"
    // "tournament/no-caps-115-msc-1400/event/ultimate-singles"
    // "tournament/smash-sans-fronti-res-271/event/smash-ultimate-singles"
    // "tournament/the-buddbuds-local-15/event/ultimate-singles"
    // "tournament/coffee-break-11-0/event/ultimate-singles"
  );
};

type Props = {
  className?: string;
};

const initialNeedsConfirmation =
  Cookies.get(COOKIES.NEEDS_TOURNAMENT_LOAD_CONFIRMATION) === undefined
    ? true
    : Cookies.get(COOKIES.NEEDS_TOURNAMENT_LOAD_CONFIRMATION) === "true";

export const TournamentLoader = ({ className }: Props) => {
  const [url, setUrl] = useState(
    "https://smash.gg/tournament/no-caps-115-msc-1400/event/ultimate-singles"
  );
  const [needsConfirmation, setNeedsConfirmation] = useState<boolean>(
    initialNeedsConfirmation
  );
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const isFetching = usePlayerStore((state) => state.fetching);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const { fetchResult } = useFetchResult();

  const loadTournament = () => {
    playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

    fetchResult(urlToSlug(url), 8);
  };

  const handleLoadClick = () => {
    if (needsConfirmation) {
      setIsConfirmationModalOpen(true);
    } else {
      loadTournament();
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNeedsConfirmation(e.currentTarget.checked ? false : true);
    Cookies.set(
      COOKIES.NEEDS_TOURNAMENT_LOAD_CONFIRMATION,
      e.currentTarget.checked ? "false" : "true"
    );
  };

  return (
    <div className={className}>
      <Input
        label="Tournament URL"
        id="tournament-url"
        name="tournament-url"
        type="text"
        value={url}
        onChange={(e) => {
          setUrl(e.currentTarget.value);
        }}
      />
      <Button loading={isFetching} onClick={handleLoadClick}>
        Load
      </Button>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        title="Load Tournament?"
        description="Any current player and tournament data will be overwritten."
        onConfirm={() => {
          loadTournament();
          setIsConfirmationModalOpen(false);
        }}
        onCancel={() => setIsConfirmationModalOpen(false)}
      >
        <div className={styles.checkboxContainer}>
          <span>Don't show again</span>
          <Input
            type="checkbox"
            onChange={handleCheckboxChange}
            checked={!needsConfirmation}
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};
