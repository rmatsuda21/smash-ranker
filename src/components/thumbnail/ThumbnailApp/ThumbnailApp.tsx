import { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { FaDownload, FaRotateLeft, FaRotateRight } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { FetchingState } from "@/components/shared/FetchingState/FetchingState";
import {
  RadioGroup,
  type RadioGroupOption,
} from "@/components/shared/RadioGroup/RadioGroup";
import { TournamentIdentity } from "@/components/shared/TournamentIdentity/TournamentIdentity";
import { TournamentUrlInput } from "@/components/shared/TournamentUrlInput/TournamentUrlInput";
import { LookPanel } from "@/components/thumbnail/LookPanel/LookPanel";
import { MatchForm } from "@/components/thumbnail/MatchForm/MatchForm";
import { SetList } from "@/components/thumbnail/SetList/SetList";
import { TemplatePicker } from "@/components/thumbnail/TemplatePicker/TemplatePicker";
import { ThumbnailExportModal } from "@/components/thumbnail/ThumbnailExportModal/ThumbnailExportModal";
import { ThumbnailPreview } from "@/components/thumbnail/ThumbnailPreview/ThumbnailPreview";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLoadThumbnailEvent } from "@/hooks/thumbnail/useLoadThumbnailEvent";
import { useThumbnailAssets } from "@/hooks/thumbnail/useThumbnailAssets";
import { selectCurrentMatch, useThumbnailStore } from "@/store/thumbnailStore";
import type { ThumbnailMatch } from "@/types/thumbnail/Thumbnail";
import type { ThumbnailScene } from "@/utils/thumbnail/painter";

import styles from "./ThumbnailApp.module.scss";

// Matches the `wide` mixin: room for the panes side by side.
const WIDE_QUERY = "(min-width: 1024px)";

type Tab = "sets" | "match" | "template" | "look";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export const ThumbnailApp = () => {
  const { _, i18n } = useLingui();
  const isWide = useMediaQuery(WIDE_QUERY);
  const isNarrow = useMediaQuery("(max-width: 768px)");

  const match = useThumbnailStore(selectCurrentMatch);
  const look = useThumbnailStore((s) => s.look);
  const event = useThumbnailStore((s) => s.event);
  const canUndo = useThumbnailStore((s) => s.past.length > 0);
  const canRedo = useThumbnailStore((s) => s.future.length > 0);
  const undo = useThumbnailStore((s) => s.undo);
  const redo = useThumbnailStore((s) => s.redo);

  const { loadEvent, loadMore, fetching, fetchingMore, error } =
    useLoadThumbnailEvent();

  const logoSrc = look.logo ?? (event?.iconUrl || null);
  const scene = useMemo<ThumbnailScene>(
    () => ({ match, look, logoSrc }),
    [match, look, logoSrc],
  );
  const { assets } = useThumbnailAssets(scene);

  const [tab, setTab] = useState<Tab>("match");
  const [exporting, setExporting] = useState<ThumbnailScene[] | null>(null);

  const save = (matches: ThumbnailMatch[]) =>
    setExporting(matches.map((item) => ({ match: item, look, logoSrc })));

  // A freshly loaded event opens on its sets (the phone's first tab).
  const eventSlug = event?.slug;
  useEffect(() => {
    if (eventSlug) setTab("sets");
  }, [eventSlug]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // A text field keeps its own undo.
      if (!(e.metaKey || e.ctrlKey) || isTyping(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const formattedDate = useMemo(() => {
    if (!event?.date) return "";
    return new Intl.DateTimeFormat(i18n.locale, { dateStyle: "medium" }).format(
      new Date(event.date),
    );
  }, [event?.date, i18n.locale]);

  const tabs: RadioGroupOption<Tab>[] = [
    ...(event && !isWide
      ? [{ value: "sets" as const, label: _(msg`Sets`) }]
      : []),
    { value: "match", label: _(msg`Match`) },
    ...(isWide
      ? []
      : [{ value: "template" as const, label: _(msg`Template`) }]),
    { value: "look", label: _(msg`Look`) },
  ];
  // A tab that the current layout or state does not have falls back to the
  // match.
  const activeTab = tabs.some((option) => option.value === tab) ? tab : "match";

  const setList = (
    <SetList
      onSave={save}
      onLoadMore={loadMore}
      fetchingMore={fetchingMore}
      onPick={isWide ? undefined : () => setTab("match")}
    />
  );

  const tabBody =
    activeTab === "sets" ? (
      setList
    ) : (
      <div className={styles.tabBody}>
        {activeTab === "match" && <MatchForm />}
        {activeTab === "template" && (
          <TemplatePicker scene={scene} assets={assets} layout="grid" />
        )}
        {activeTab === "look" && <LookPanel />}
      </div>
    );

  const tabBar = (
    <div className={styles.tabBar}>
      <RadioGroup
        className={styles.tabs}
        options={tabs}
        value={activeTab}
        onChange={setTab}
      />
    </div>
  );

  return (
    <div className={styles.root}>
      <header className={cn(styles.header, event && styles.hasEvent)}>
        {event ? (
          <TournamentIdentity
            className={styles.identity}
            href={event.url}
            iconUrl={event.iconUrl}
            name={event.tournamentName}
            meta={[event.eventName, formattedDate].filter(Boolean).join(" · ")}
          />
        ) : (
          <h1 className={styles.title}>
            <Trans>Thumbnail</Trans>
          </h1>
        )}
        <TournamentUrlInput
          className={styles.urlInput}
          onLoad={loadEvent}
          isFetching={fetching}
          inputId="thumbnail-event-url"
          variant="pill"
          placeholder={
            isNarrow
              ? _(msg`Paste URL`)
              : _(msg`Paste a start.gg event link to fill in its matches`)
          }
        />
        <div className={styles.actions}>
          <Button
            className={styles.history}
            variant="ghost"
            size="sm"
            tooltip={_(msg`Undo`)}
            disabled={!canUndo}
            onClick={undo}
          >
            <FaRotateLeft />
          </Button>
          <Button
            className={styles.history}
            variant="ghost"
            size="sm"
            tooltip={_(msg`Redo`)}
            disabled={!canRedo}
            onClick={redo}
          >
            <FaRotateRight />
          </Button>
          <Button size="sm" onClick={() => save([match])}>
            <FaDownload />
            <span className={styles.saveLabel}>
              <Trans>Save image</Trans>
            </span>
          </Button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.workspace} aria-busy={fetching}>
        {isWide ? (
          <>
            {event && <aside className={styles.sets}>{setList}</aside>}
            <main className={styles.stage}>
              <div className={styles.stageInner}>
                <div className={styles.previewArea}>
                  <ThumbnailPreview
                    className={styles.preview}
                    scene={scene}
                    assets={assets}
                  />
                  <p className={styles.hint}>
                    <Trans>
                      Drag a character to move it. Scroll over it to resize it.
                    </Trans>
                  </p>
                </div>
                <div className={styles.strip}>
                  <h2 className={styles.stripTitle}>
                    <Trans>Template</Trans>
                  </h2>
                  <TemplatePicker scene={scene} assets={assets} layout="row" />
                </div>
              </div>
            </main>
            <aside className={styles.panel}>
              {tabBar}
              {tabBody}
            </aside>
          </>
        ) : (
          <>
            <ThumbnailPreview
              className={styles.preview}
              scene={scene}
              assets={assets}
            />
            {tabBar}
            <div className={styles.tabScroll}>{tabBody}</div>
          </>
        )}

        {fetching && (
          <FetchingState
            mode="overlay"
            heading={<Trans>Loading sets</Trans>}
            taglines={[msg`Asking start.gg very nicely...`]}
          />
        )}
      </div>

      <ThumbnailExportModal
        scenes={exporting}
        zipName={`${event?.slug.split("/")[1] ?? "smash"}-thumbnails.zip`}
        onClose={() => setExporting(null)}
      />
    </div>
  );
};
