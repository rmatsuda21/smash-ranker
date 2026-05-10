import { type RefObject } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import xIcon from "@/assets/social/x_icon.webp";
import type { SocialPlatform } from "@/types/social/SocialTemplate";
import {
  type AnalysisContext,
  type TokenMatch,
} from "@/utils/social/tokenAnalysis";

import {
  TokenHighlightEditor,
  type TokenHighlightEditorHandle,
} from "./TokenHighlightEditor";
import { PlainTextEditor } from "./PlainTextEditor";
import styles from "./SocialPostComposer.module.scss";

export type ComposerMode = "plain" | "template";

const AUTHOR_NAME = "地球のジン";
const AUTHOR_HANDLE = "chikyunojin";

type Props = {
  platform: SocialPlatform;
  mode: ComposerMode;
  text: string;
  matches: TokenMatch[];
  onChange: (next: { text: string; matches: TokenMatch[] }) => void;
  ctx: AnalysisContext;
  editorRef: RefObject<TokenHighlightEditorHandle | null>;
  imageUrl: string | null;
  imageLoading: boolean;
  getTokenLabel: (token: string) => string;
};

export const PlatformPreview = ({
  platform,
  mode,
  text,
  matches,
  onChange,
  ctx,
  editorRef,
  imageUrl,
  imageLoading,
  getTokenLabel,
}: Props) => {
  const isX = platform === "x";

  const handle = isX
    ? `@${AUTHOR_HANDLE}`
    : `@${AUTHOR_HANDLE}.bsky.social`;

  const editorClassName = cn(
    styles.bodyEditor,
    isX ? styles.bodyEditorX : styles.bodyEditorBluesky,
  );

  return (
    <div
      className={cn(
        styles.preview,
        isX ? styles.previewX : styles.previewBluesky,
      )}
    >
      {/* Avatar lives in its own column so the header (name / handle / time)
          can sit flush against the body content with no gap. Mirrors the
          actual X / Bluesky layout. */}
      <div className={styles.avatarCol}>
        <img className={styles.avatar} src={xIcon} alt="" />
      </div>

      <div className={styles.mainCol}>
        <div className={styles.handleRow}>
          <span
            className={cn(
              styles.handleName,
              isX ? styles.handleNameX : styles.handleNameBluesky,
            )}
          >
            {AUTHOR_NAME}
          </span>
          <span
            className={cn(
              styles.handleId,
              isX ? styles.handleIdX : styles.handleIdBluesky,
            )}
          >
            {handle}
          </span>
          <span
            className={cn(
              styles.handleDot,
              isX ? styles.handleDotX : styles.handleDotBluesky,
            )}
            aria-hidden="true"
          >
            ·
          </span>
          <span
            className={cn(
              styles.handleTime,
              isX ? styles.handleTimeX : styles.handleTimeBluesky,
            )}
          >
            <Trans>Just now</Trans>
          </span>
        </div>

        {mode === "template" ? (
          <TokenHighlightEditor
            ref={editorRef}
            text={text}
            matches={matches}
            onChange={onChange}
            ctx={ctx}
            getTokenLabel={getTokenLabel}
            className={editorClassName}
          />
        ) : (
          <PlainTextEditor
            text={text}
            onChange={(nextText) => onChange({ text: nextText, matches: [] })}
            className={editorClassName}
          />
        )}

        <div
          className={cn(
            styles.imageWrap,
            isX ? styles.imageWrapX : styles.imageWrapBluesky,
          )}
        >
          {imageUrl && !imageLoading ? (
            <img
              src={imageUrl}
              className={styles.imageEl}
              alt=""
              loading="eager"
            />
          ) : (
            <div className={styles.imageShimmer} aria-hidden="true" />
          )}
        </div>

        <div
          className={cn(
            styles.previewFooter,
            isX ? styles.previewFooterX : styles.previewFooterBluesky,
          )}
        >
          <span
            className={cn(
              styles.fauxPostButton,
              isX ? styles.fauxPostButtonX : styles.fauxPostButtonBluesky,
            )}
            aria-hidden="true"
          >
            <Trans>Post</Trans>
          </span>
        </div>
      </div>
    </div>
  );
};
