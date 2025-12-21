import { useState } from "react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useFetchResult } from "@/hooks/top8/useFetchResult";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";

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

export const TournamentLoader = ({ className }: Props) => {
  const [url, setUrl] = useState(
    "https://smash.gg/tournament/no-caps-115-msc-1400/event/ultimate-singles"
  );

  const isFetching = usePlayerStore((state) => state.fetching);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const { fetchResult } = useFetchResult();

  const handleLoadClick = () => {
    playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

    fetchResult(urlToSlug(url), 8);
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
    </div>
  );
};
