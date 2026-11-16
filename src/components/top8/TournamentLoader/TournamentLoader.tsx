import { useEffect, useMemo, useRef, useState } from "react";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaCircleInfo, FaLink } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { useFetchResult } from "@/hooks/top8/useFetchResult";
import { useFetchChallonge } from "@/hooks/top8/useFetchChallonge";
import { useFetchTonamel } from "@/hooks/top8/useFetchTonamel";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { PREF_KEYS } from "@/consts/prefKeys";
import { useConfirmation } from "@/hooks/useConfirmation";
import { detectPlatformAndSlug, slugToUrl } from "@/consts/platforms";
import { clearToolLink, readToolLink } from "@/utils/user/toolLinks";
import { logEvent } from "@/utils/observability/log";

import styles from "./TournamentLoader.module.scss";
import { Trans } from "@lingui/react/macro";

// Overfetch so users can switch to larger templates without re-loading.
// 32 keeps the start.gg standings query well under the 1000 complexity cap.
const MIN_FETCH_COUNT = 32;

type Props = {
  className?: string;
};

export const TournamentLoader = ({ className }: Props) => {
  const { _ } = useLingui();
  // Arriving from a "Top 8 graphic" link (home page, profile) starts with
  // that event's URL filled in and asks to load it.
  const [url, setUrl] = useState(() => {
    const link = readToolLink();
    return link ? slugToUrl("startgg", link.slug) : "";
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const isFetching = usePlayerStore((state) => state.fetching);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const designPlayerCount = useCanvasStore(
    (state) => state.design.players.length,
  );

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

    const fetchCount = Math.max(designPlayerCount, MIN_FETCH_COUNT);

    logEvent("tournament_url_submit", {
      tournament_platform: detected.platform,
      surface: "ranker",
    });

    if (detected.platform === "startgg") {
      fetchResult(detected.slug, fetchCount);
    } else if (detected.platform === "challonge") {
      fetchChallonge(detected.slug, fetchCount);
    } else if (detected.platform === "tonamel") {
      fetchTonamel(detected.slug, fetchCount);
    }
  };

  const { confirm: confirmLoad, confirmationDialog: loadConfirmation } =
    useConfirmation(loadTournament, {
      title: _(msg`Load Tournament?`),
      description: _(
        msg`Any current player and tournament data will be overwritten.`,
      ),
      rememberKey: PREF_KEYS.NEEDS_TOURNAMENT_LOAD_CONFIRMATION,
    });

  const didAutoLoadRef = useRef(false);
  useEffect(() => {
    if (didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;
    if (!readToolLink()) return;
    clearToolLink();
    if (isValid) confirmLoad();
    // Runs once, for the link the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On a phone the field shares the toolbar row until it is focused, and
  // only has room for a few words.
  const isNarrow = window.matchMedia("(max-width: 768px)").matches;
  const placeholder =
    isNarrow && !isFocused ? _(msg`Paste URL`) : _(msg`Paste a tournament URL`);

  const submit = () => {
    if (isValid && !isFetching) confirmLoad();
  };

  return (
    <div className={cn(styles.tournamentLoader, className)}>
      <div
        className={cn(styles.field, {
          [styles.valid]: hasInput && isValid,
          [styles.error]: hasInput && !isValid,
        })}
      >
        <FaLink className={styles.leadingIcon} aria-hidden="true" />
        <input
          ref={inputRef}
          id="tournament-url"
          name="tournament-url"
          type="text"
          inputMode="url"
          enterKeyHint="go"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label={_(msg`Tournament URL`)}
          aria-invalid={hasInput && !isValid}
          placeholder={placeholder}
          value={url}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setUrl(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            // Dismiss the on-screen keyboard so the confirmation is visible.
            e.currentTarget.blur();
            submit();
          }}
        />
        <span
          className={styles.infoButton}
          role="button"
          tabIndex={0}
          aria-label={_(msg`Show help`)}
        >
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
        <Button
          className={styles.loadButton}
          size="sm"
          loading={isFetching}
          disabled={!isValid}
          // On phones the button only exists while the input has focus, so
          // keep focus there until the tap has landed, then drop it to close
          // the keyboard and show the confirmation.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            inputRef.current?.blur();
            confirmLoad();
          }}
        >
          {_(msg`Load`)}
        </Button>
      </div>

      {loadConfirmation}
    </div>
  );
};
