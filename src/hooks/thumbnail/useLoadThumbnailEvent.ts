import { useRef, useState } from "react";
import { t } from "@lingui/core/macro";

import { detectPlatformAndSlug, slugToUrl } from "@/consts/platforms";
import {
  SET_PAGES_PER_LOAD,
  SETS_PER_PAGE,
} from "@/consts/thumbnail/thumbnail";
import { useThumbnailStore } from "@/store/thumbnailStore";
import { logEvent, logWarning } from "@/utils/observability/log";
import type { ThumbnailSet } from "@/types/thumbnail/Thumbnail";
import {
  fetchThumbnailEventMeta,
  fetchThumbnailSetPages,
  type ThumbnailEventMeta,
} from "@/utils/thumbnail/fetchEventSets";
import { fetchHiveeThumbnailEvent } from "@/utils/thumbnail/fetchHiveeSets";

// Loads an event's sets into the thumbnail maker. start.gg: the newest pages
// first, more on request. Hivee: every finished match at once.
export const useLoadThumbnailEvent = () => {
  const [fetching, setFetching] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A slow load must not overwrite a newer one.
  const requestRef = useRef(0);

  const loadEvent = async (url: string) => {
    const detected = detectPlatformAndSlug(url);
    if (!detected) return;
    if (detected.platform !== "startgg" && detected.platform !== "hivee") {
      setError(
        t`Thumbnails load matches from start.gg and Hivee only for now. You can still fill in the match by hand.`,
      );
      return;
    }

    const request = ++requestRef.current;
    setFetching(true);
    setError(null);
    logEvent("tournament_url_submit", {
      tournament_platform: detected.platform,
      surface: "thumbnail",
    });

    try {
      const isHivee = detected.platform === "hivee";
      let meta: ThumbnailEventMeta | null;
      let firstPages: { sets: ThumbnailSet[]; total: number };
      if (isHivee) {
        const loaded = await fetchHiveeThumbnailEvent(detected.slug);
        meta = loaded.meta;
        firstPages = { sets: loaded.sets, total: loaded.sets.length };
      } else {
        [meta, firstPages] = await Promise.all([
          fetchThumbnailEventMeta(detected.slug),
          fetchThumbnailSetPages(detected.slug, 1, SET_PAGES_PER_LOAD),
        ]);
      }
      if (request !== requestRef.current) return;
      if (!meta) throw new Error(t`Tournament not found`);
      if (firstPages.sets.length === 0) {
        throw new Error(t`This event has no sets with players yet.`);
      }
      // Hivee's matches all came in one go: count them as read.
      const loadedPages = isHivee
        ? Math.ceil(firstPages.total / SETS_PER_PAGE)
        : SET_PAGES_PER_LOAD;

      useThumbnailStore.getState().loadEvent({
        event: {
          slug: detected.slug,
          url: slugToUrl(detected.platform, detected.slug),
          tournamentId: meta.tournamentId,
          tournamentName: meta.tournamentName,
          eventName: meta.eventName,
          date: meta.date,
          iconUrl: meta.iconUrl,
          totalSets: firstPages.total,
          loadedPages,
        },
        sets: firstPages.sets,
        game: meta.game,
      });
      logEvent("tournament_load", {
        tournament_platform: detected.platform,
        surface: "thumbnail",
        set_count: firstPages.sets.length,
      });
    } catch (err) {
      if (request !== requestRef.current) return;
      const message =
        err instanceof Error ? err.message : t`Failed to fetch tournament`;
      setError(message);
      logWarning("thumbnail event load failed", {
        area: "thumbnail-fetch",
        tournament_slug: detected.slug,
        error: message,
      });
      logEvent("tournament_fetch_fail", {
        tournament_platform: detected.platform,
        surface: "thumbnail",
        failure_kind: "query_error",
      });
    } finally {
      if (request === requestRef.current) setFetching(false);
    }
  };

  const loadMore = async () => {
    const { event, appendSets } = useThumbnailStore.getState();
    if (!event || fetchingMore) return;
    const request = requestRef.current;
    setFetchingMore(true);
    try {
      const next = await fetchThumbnailSetPages(
        event.slug,
        event.loadedPages + 1,
        SET_PAGES_PER_LOAD,
      );
      if (request !== requestRef.current) return;
      appendSets(next.sets, event.loadedPages + SET_PAGES_PER_LOAD);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t`Failed to load more sets`,
      );
    } finally {
      setFetchingMore(false);
    }
  };

  return { loadEvent, loadMore, fetching, fetchingMore, error };
};

// Whether the event has sets older than the pages read so far.
export const hasMoreSets = (
  event: { totalSets: number; loadedPages: number } | null,
): boolean => !!event && event.loadedPages * SETS_PER_PAGE < event.totalSets;
