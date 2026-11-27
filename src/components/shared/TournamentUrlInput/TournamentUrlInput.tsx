import { useMemo, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaLink } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { UrlHint } from "@/components/shared/UrlHint/UrlHint";
import { detectPlatformAndSlug } from "@/consts/platforms";

import styles from "./TournamentUrlInput.module.scss";

type Props = {
  onLoad: (url: string) => void;
  isFetching: boolean;
  inputId: string;
  placeholder?: string;
  // "pill" is the toolbar field used by /ranker: one rounded control holding
  // the icon, the URL and the Load action, with no label above it.
  variant?: "labeled" | "pill";
  className?: string;
};

export const TournamentUrlInput = ({
  onLoad,
  isFetching,
  inputId,
  placeholder = "https://start.gg/tournament/.../event/...",
  variant = "labeled",
  className,
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

  if (variant === "pill") {
    return (
      <div
        className={cn(styles.pill, className, {
          [styles.valid]: hasInput && isValid,
          [styles.error]: hasInput && !isValid,
        })}
      >
        <FaLink className={styles.leadingIcon} aria-hidden="true" />
        <input
          id={inputId}
          name={inputId}
          type="text"
          inputMode="url"
          enterKeyHint="go"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label={_(msg`Tournament URL`)}
          aria-invalid={hasInput && !isValid}
          value={url}
          placeholder={placeholder}
          onChange={(e) => setUrl(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          className={styles.pillButton}
          size="sm"
          loading={isFetching}
          disabled={!isValid}
          // A parent may show the button only while the input has focus, so
          // keep focus there until the click has landed.
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLoad}
        >
          <Trans>Load</Trans>
        </Button>
        {hasInput && !isValid && <UrlHint url={url} />}
      </div>
    );
  }

  return (
    <div className={cn(styles.root, className)}>
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
      {hasInput && !isValid && <UrlHint url={url} />}
    </div>
  );
};
