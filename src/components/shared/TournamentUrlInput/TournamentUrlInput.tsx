import { useMemo, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { detectPlatformAndSlug } from "@/consts/platforms";

import styles from "./TournamentUrlInput.module.scss";

type Props = {
  onLoad: (url: string) => void;
  isFetching: boolean;
  inputId: string;
  placeholder?: string;
};

export const TournamentUrlInput = ({
  onLoad,
  isFetching,
  inputId,
  placeholder = "https://start.gg/tournament/.../event/...",
}: Props) => {
  const { _ } = useLingui();
  const [url, setUrl] = useState("");

  const detected = useMemo(() => detectPlatformAndSlug(url), [url]);
  const isValid = detected !== null;
  const hasInput = url.trim().length > 0;

  const handleLoad = () => {
    if (!isValid) return;
    onLoad(url);
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
          id={inputId}
          name={inputId}
          type="text"
          value={url}
          placeholder={placeholder}
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
