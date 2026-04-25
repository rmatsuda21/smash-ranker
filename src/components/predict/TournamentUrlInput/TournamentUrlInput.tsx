import { useMemo, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { detectPlatformAndSlug } from "@/consts/platforms";
import { usePredictionStore } from "@/store/predictionStore";
import { useFetchPredictionEntrants } from "@/hooks/predict/useFetchPredictionEntrants";

import styles from "./TournamentUrlInput.module.scss";

export const TournamentUrlInput = () => {
  const { _ } = useLingui();
  const [url, setUrl] = useState("");
  const isFetching = usePredictionStore((state) => state.fetching);
  const { fetchEntrants } = useFetchPredictionEntrants();

  const detected = useMemo(() => detectPlatformAndSlug(url), [url]);
  const isValid = detected !== null;
  const hasInput = url.trim().length > 0;

  const handleLoad = () => {
    if (!isValid) return;
    fetchEntrants(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      handleLoad();
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.inputRow}>
        <Input
          className={cn({
            [styles.valid]: hasInput && isValid,
            [styles.error]: hasInput && !isValid,
          })}
          label={_(msg`Tournament URL`)}
          id="predict-tournament-url"
          name="predict-tournament-url"
          type="text"
          value={url}
          placeholder="https://start.gg/tournament/.../event/..."
          onChange={(e) => setUrl(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Button loading={isFetching} disabled={!isValid} onClick={handleLoad}>
          <Trans>Load</Trans>
        </Button>
      </div>
    </div>
  );
};
