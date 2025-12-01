import { useState } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { usePlayerStore } from "@/store/playerStore";

// TODO: Eventually make a tournament searcher here
export const TournamentConfig = () => {
  const [url, setUrl] = useState("");

  const { fetchTop8 } = useFetchTop8();
  const isFetching = usePlayerStore((state) => state.fetching);

  const handleLoadClick = () => {
    fetchTop8(
      "tournament/genesis-9-1/event/ultimate-singles"
      // "tournament/smash-sans-fronti-res-271/event/smash-ultimate-singles"
      // "tournament/the-buddbuds-local-15/event/ultimate-singles"
      // "tournament/coffee-break-11-0/event/ultimate-singles"
    );
  };

  return (
    <div>
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
