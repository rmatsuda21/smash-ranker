import { useState } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";

const urlToSlug = (url: string) => {
  const match = url.match(/tournament\/([^/]+)\/event\/([^/]+)/);
  if (match) {
    return `tournament/${match[1]}/event/${match[2]}`;
  }
  return (
    // "tournament/genesis-9-1/event/ultimate-singles"
    // "tournament/sp12-umeburasp12/event/singles"
    "tournament/no-caps-115-msc-1400/event/ultimate-singles"
    // "tournament/smash-sans-fronti-res-271/event/smash-ultimate-singles"
    // "tournament/the-buddbuds-local-15/event/ultimate-singles"
    // "tournament/coffee-break-11-0/event/ultimate-singles"
  );
};

type Props = {
  className?: string;
};

// TODO: Eventually make a tournament searcher here
export const TournamentConfig = ({ className }: Props) => {
  const [url, setUrl] = useState("");

  const { fetchTop8 } = useFetchTop8();
  const isFetching = usePlayerStore((state) => state.fetching);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const handleLoadClick = () => {
    playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

    fetchTop8(urlToSlug(url));
  };

  return (
    <div className={className}>
      <TextField.Root
        type="text"
        value={url}
        onChange={(e) => {
          setUrl(e.currentTarget.value);
        }}
      ></TextField.Root>
      <Button loading={isFetching} onClick={handleLoadClick}>
        Load
      </Button>
    </div>
  );
};
