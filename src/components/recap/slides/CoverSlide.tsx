import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { useRecapStory } from "@/components/recap/RecapStory/RecapStoryContext";
import { PLAYER_TYPES } from "@/consts/recap/playerTypes";
import type { Recap } from "@/types/recap/Recap";
import { logEvent, logWarning } from "@/utils/observability/log";
import {
  COVER_HEIGHT,
  COVER_INTRO_SECONDS,
  COVER_WIDTH,
  drawRecapCover,
  loadRecapCoverAssets,
  renderRecapCoverImage,
  type RecapCoverAssets,
  type RecapCoverText,
} from "@/utils/recap/recapCover";
import {
  canShareImage,
  copyImageToClipboard,
} from "@/utils/social/clipboardImage";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import { formatOrdinal } from "@/utils/user/ordinal";

import styles from "../recap.module.scss";

const filenameFor = (tag: string, year: number) =>
  `${
    tag
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "player"
  }-recap-${year}.png`;

// The slide people share: a magazine cover with the player as cover star.
// One painter draws it for the screen and for the shared image.
export const CoverSlide = ({ recap }: { recap: Recap }) => {
  const { _, i18n } = useLingui();
  const story = useRecapStory();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<RecapCoverAssets | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  const mainId = recap.characters[0]?.id ?? null;
  const locale = i18n.locale;

  const text = useMemo((): RecapCoverText => {
    const { year, wins, losses, winPercent, tournaments, top8, winStreak } =
      recap;
    const cities = recap.cities.length;
    const best = recap.bestRun;
    const upset = recap.upsets[0];
    const type =
      PLAYER_TYPES.find((entry) => entry.id === recap.type) ?? PLAYER_TYPES[0];

    const lines = [
      {
        value: `${wins}–${losses}`,
        caption: _(msg`sets. ${winPercent}% of them won.`),
      },
      {
        value: _(
          msg({
            message: `${tournaments}`,
            comment: "Cover headline: the number of tournaments entered",
          }),
        ),
        caption:
          cities > 0
            ? _(msg`tournaments, ${cities} cities.`)
            : _(msg`tournaments.`),
      },
      top8 > 0
        ? {
            value: _(
              msg({
                message: `${top8}`,
                comment: "Cover headline: the number of top 8 finishes",
              }),
            ),
            caption: _(msg`top 8 finishes.`),
          }
        : {
            value: _(
              msg({
                message: `${winStreak}`,
                comment: "Cover headline: the longest set win streak",
              }),
            ),
            caption: _(msg`set wins in a row.`),
          },
    ];

    const bars: string[] = [];
    if (best) {
      const place = formatOrdinal(best.placement, locale);
      const entrants = best.entrants;
      const name = best.name;
      bars.push(_(msg`${place} of ${entrants} at ${name}`));
    }
    const seed = upset?.seed;
    const opponentSeed = upset?.opponentSeed;
    const upsetLine = upset
      ? _(msg`Seed ${seed} beat seed ${opponentSeed}`)
      : null;
    // A Japanese cover sets this one down the right edge.
    const vertical = locale.startsWith("ja") ? upsetLine : null;
    if (upsetLine && !vertical) bars.push(upsetLine);

    return {
      issue: _(msg`The year-end issue · ${year}`),
      number: `No. ${recap.player.userId}`,
      masthead: "RECAP",
      lines,
      bars,
      vertical,
      stickerLabel: _(msg`${year} type`),
      stickerName: _(type.name),
      strap: _(msg`Cover star`),
      tag: recap.player.tag,
      site: "smash-ranker.app",
    };
  }, [recap, locale, _]);

  useEffect(() => {
    let cancelled = false;
    loadRecapCoverAssets(mainId, text).then((loaded) => {
      if (!cancelled) setAssets(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [mainId, text]);

  // The layers play in on screen.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !assets) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawRecapCover(ctx, text, assets);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const time = (now - start) / 1000;
      drawRecapCover(ctx, text, assets, time);
      if (time < COVER_INTRO_SECONDS) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [assets, text]);

  // The image to share, made ahead of the tap so the share sheet opens
  // straight from it.
  useEffect(() => {
    if (!assets) return;
    let cancelled = false;
    renderRecapCoverImage(text, assets)
      .then((image) => {
        if (!cancelled) setBlob(image);
      })
      .catch((err: unknown) => {
        logWarning("recap cover render failed", {
          area: "recap",
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [assets, text]);

  const file = useMemo(
    () =>
      blob
        ? new File([blob], filenameFor(recap.player.tag, recap.year), {
            type: "image/png",
          })
        : null,
    [blob, recap.player.tag, recap.year],
  );
  const canShare = file !== null && canShareImage(file);

  const logExport = (share_method: string) =>
    logEvent("graphic_export_complete", {
      export_surface: "recap",
      export_format: "png",
      share_method,
    });

  const handleShare = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file] });
      logExport("share_sheet");
    } catch {
      // Closing the share sheet is not an error.
    }
  };
  const handleDownload = async () => {
    if (!blob || !file) return;
    await downloadBlob({ blob, filename: file.name, mimeType: "image/png" });
    logExport("download");
  };
  const handleCopy = async () => {
    if (!blob) return;
    const result = await copyImageToClipboard(blob);
    if (!result.ok) return;
    logExport("clipboard");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className={cn(styles.slide, styles.gInk, styles.sum)}>
      <div className={styles.coverWrap}>
        <canvas
          ref={canvasRef}
          className={styles.cover}
          width={COVER_WIDTH}
          height={COVER_HEIGHT}
          role="img"
          aria-label={_(msg`Your recap as a magazine cover`)}
        />
      </div>
      <div
        className={cn(styles.btns, styles.rise)}
        style={{ "--i": 3 } as CSSProperties}
      >
        {canShare && (
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleShare}
          >
            <Trans>Share</Trans>
          </button>
        )}
        <button
          type="button"
          className={cn(!canShare && styles.btnPrimary)}
          disabled={!blob}
          onClick={handleDownload}
        >
          <Trans>Save</Trans>
        </button>
        <button type="button" disabled={!blob} onClick={handleCopy}>
          {copied ? <Trans>Copied!</Trans> : <Trans>Copy</Trans>}
        </button>
        <button type="button" onClick={story.replay}>
          <Trans>Replay</Trans>
        </button>
      </div>
    </section>
  );
};
