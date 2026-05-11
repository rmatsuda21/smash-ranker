import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import {
  FaArrowLeft,
  FaBluesky,
  FaCopy,
  FaDownload,
  FaFloppyDisk,
  FaPenToSquare,
  FaXTwitter,
  FaXmark,
} from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";
import { Input } from "@/components/shared/Input/Input";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import {
  useSocialPostStore,
  loadCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
} from "@/store/socialPostStore";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import {
  formatTokenLabel,
  getInsertableTokens,
} from "@/utils/social/templateTokens";
import {
  type AnalysisContext,
  type TokenMatch,
  findAllMatches,
  getMatchers,
  reresolveForContext,
  resolveWithRanges,
  stitchToBody,
} from "@/utils/social/tokenAnalysis";
import { resolveSocialTemplate } from "@/utils/social/resolveSocialTemplate";
import {
  getBuiltInTemplates,
  getBuiltInTemplateBody,
} from "@/utils/social/builtInTemplates";
import {
  countBlueskyGraphemes,
  X_CHAR_LIMIT,
  BLUESKY_CHAR_LIMIT,
} from "@/utils/social/charCount";
import { copyImageToClipboard } from "@/utils/social/clipboardImage";
import {
  buildBlueskyIntent,
  buildXIntent,
} from "@/utils/social/buildIntentUrl";
import type { SocialPlatform } from "@/types/social/SocialTemplate";
import type { StageBlobCache } from "@/hooks/top8/useStageBlobCache";

import { CharCounter } from "./CharCounter";
import { useCanvasImage, useTwitterTextParser } from "./hooks";
import { PlatformPreview, type ComposerMode } from "./PlatformPreview";
import { PlatformTabs } from "./PlatformTabs";
import { TemplatePicker } from "./TemplatePicker";
import { TemplateSelector } from "./TemplateSelector";
import { type TokenHighlightEditorHandle } from "./TokenHighlightEditor";
import styles from "./SocialPostComposer.module.scss";

const filenameFromTournament = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "") || "ranker";

const lookupTemplateBody = (
  id: string,
  customTemplates: { id: string; body: string }[],
): string | null =>
  getBuiltInTemplateBody(id) ??
  customTemplates.find((t) => t.id === id)?.body ??
  null;

type Props = {
  onClose: () => void;
  blobCache?: StageBlobCache;
};

const SocialPostComposer = ({ onClose, blobCache }: Props) => {
  const { _, i18n } = useLingui();

  const stageRef = useCanvasStore((state) => state.stageRef);
  const players = usePlayerStore((state) => state.players);
  const tournamentInfo = useTournamentStore((state) => state.info);

  const selectedPlatform = useSocialPostStore((s) => s.selectedPlatform);
  const selectedTemplateId = useSocialPostStore((s) => s.selectedTemplateId);
  const customTemplates = useSocialPostStore((s) => s.customTemplates);
  const customTemplatesLoaded = useSocialPostStore(
    (s) => s.customTemplatesLoaded,
  );
  const dispatch = useSocialPostStore((s) => s.dispatch);

  const [mode, setMode] = useState<ComposerMode>("plain");
  const [displayText, setDisplayText] = useState("");
  const [matches, setMatches] = useState<TokenMatch[]>([]);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(
    null,
  );
  const [templateName, setTemplateName] = useState("");

  const editorRef = useRef<TokenHighlightEditorHandle>(null);
  const initialResolvedRef = useRef(false);
  /** displayText immediately after the last template load — used to detect
   *  unsaved edits before clobbering them with a different template. */
  const templateLoadSnapshotRef = useRef<string>("");

  const ctx = useMemo<AnalysisContext>(
    () => ({
      players,
      tournament: tournamentInfo,
      platform: selectedPlatform,
    }),
    [players, tournamentInfo, selectedPlatform],
  );
  const ctxRef = useRef(ctx);
  const matchesRef = useRef(matches);
  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  const builtInTemplates = useMemo(() => getBuiltInTemplates(i18n), [i18n]);
  const insertableTokens = useMemo(
    () => getInsertableTokens(i18n, players),
    [i18n, players],
  );
  const getTokenLabel = useCallback(
    (token: string) => formatTokenLabel(token, i18n),
    [i18n],
  );

  const filename = useMemo(
    () => `${filenameFromTournament(tournamentInfo.tournamentName)}.png`,
    [tournamentInfo.tournamentName],
  );

  const currentBody = useMemo(
    () => stitchToBody(displayText, matches),
    [displayText, matches],
  );

  const {
    blob: imageBlob,
    url: imageUrl,
    loading: imageLoading,
  } = useCanvasImage(stageRef, blobCache);
  const parseTweet = useTwitterTextParser(selectedPlatform === "x");

  const charCount = useMemo(() => {
    if (selectedPlatform === "x") {
      return parseTweet
        ? parseTweet(displayText).weightedLength
        : displayText.length;
    }
    return countBlueskyGraphemes(displayText);
  }, [selectedPlatform, displayText, parseTweet]);
  const charLimit =
    selectedPlatform === "x" ? X_CHAR_LIMIT : BLUESKY_CHAR_LIMIT;
  const isOver = charCount > charLimit;
  const hasPlayers = players.length > 0;
  const canPost = hasPlayers && !isOver;

  // Initial mount: seed the plain-text editor with the resolved default
  // template so the user has something to start from.
  useEffect(() => {
    if (initialResolvedRef.current) return;
    const body = lookupTemplateBody(selectedTemplateId, customTemplates);
    if (body == null) return;
    const resolved = resolveSocialTemplate(body, ctxRef.current);
    setDisplayText(resolved);
    setMatches(findAllMatches(resolved, getMatchers(ctxRef.current)));
    templateLoadSnapshotRef.current = resolved;
    initialResolvedRef.current = true;
  }, [selectedTemplateId, customTemplates]);

  useEffect(() => {
    if (!customTemplatesLoaded) void loadCustomTemplates();
  }, [customTemplatesLoaded]);

  /** Re-resolve token spans when the platform/context changes (e.g. X
   *  handle → Bluesky display name). Walks the existing matches in place
   *  so the user's edits are preserved. */
  useEffect(() => {
    if (ctxRef.current === ctx) return;
    setDisplayText((prevText) => {
      const next = reresolveForContext(prevText, matchesRef.current, ctx);
      setMatches(next.matches);
      return next.text;
    });
    ctxRef.current = ctx;
  }, [ctx]);

  const applyTemplate = (id: string) => {
    dispatch({ type: "SET_TEMPLATE", payload: id });
    const body = lookupTemplateBody(id, customTemplates);
    if (body == null) return;
    if (mode === "template") {
      const { text, matches: nextMatches } = resolveWithRanges(
        body,
        ctxRef.current,
      );
      setDisplayText(text);
      setMatches(nextMatches);
      templateLoadSnapshotRef.current = text;
    } else {
      const resolved = resolveSocialTemplate(body, ctxRef.current);
      setDisplayText(resolved);
      setMatches(findAllMatches(resolved, getMatchers(ctxRef.current)));
      templateLoadSnapshotRef.current = resolved;
    }
  };

  const handlePickTemplate = (id: string) => {
    if (id === selectedTemplateId) return;
    if (displayText !== templateLoadSnapshotRef.current) {
      setPendingTemplateId(id);
      return;
    }
    applyTemplate(id);
  };
  const handleConfirmTemplateSwitch = () => {
    if (pendingTemplateId) applyTemplate(pendingTemplateId);
    setPendingTemplateId(null);
  };
  const handleCancelTemplateSwitch = () => setPendingTemplateId(null);

  const handleSetPlatform = (platform: SocialPlatform) =>
    dispatch({ type: "SET_PLATFORM", payload: platform });

  const handleEditorChange = ({
    text,
    matches: nextMatches,
  }: {
    text: string;
    matches: TokenMatch[];
  }) => {
    setDisplayText(text);
    if (mode === "template") {
      setMatches(nextMatches);
    } else {
      // Plain editor reports `matches: []` because it doesn't run
      // detection. We do a full scan here so matches stay populated for
      // the platform-switch effect to use.
      setMatches(findAllMatches(text, getMatchers(ctxRef.current)));
    }
  };

  const handleEnterTemplateMode = () => {
    // Auto-detect tokens in whatever the user has typed in plain mode so
    // they immediately see what will be dynamic when reused.
    setMatches(findAllMatches(displayText, getMatchers(ctxRef.current)));
    setMode("template");
  };
  const handleExitTemplateMode = () => setMode("plain");

  const handleInsertVariable = (token: string) =>
    editorRef.current?.insertToken(token);

  const handleDeleteTemplate = (id: string) => void deleteCustomTemplate(id);

  const handleDownload = async () => {
    if (!imageBlob) return false;
    await downloadBlob({ blob: imageBlob, filename, mimeType: "image/png" });
  };

  const handleCopyImage = async () => {
    if (!imageBlob) return false;
    const result = await copyImageToClipboard(imageBlob);
    return result.ok;
  };

  const handlePost = () => {
    if (!canPost) return;
    const intentUrl =
      selectedPlatform === "x"
        ? buildXIntent(displayText)
        : buildBlueskyIntent(displayText);
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  };

  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    const body = currentBody.trim();
    if (!name || !body) return;
    await saveCustomTemplate(name, body);
    setTemplateName("");
  };

  return (
    <div className={styles.composer}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          <Trans>Share to social</Trans>
        </h2>
        <button
          type="button"
          className={styles.closeButton}
          aria-label={_(msg`Close`)}
          onClick={onClose}
        >
          <FaXmark />
        </button>
      </div>

      {!hasPlayers ? (
        <div className={styles.empty}>
          <Trans>Load a tournament to compose a post.</Trans>
        </div>
      ) : (
        <>
          <div className={styles.composerBody}>
            <PlatformTabs
              selected={selectedPlatform}
              onSelect={handleSetPlatform}
            />

            <TemplateSelector
              builtIn={builtInTemplates}
              custom={customTemplates}
              selectedId={selectedTemplateId}
              onSelect={handlePickTemplate}
              onDelete={handleDeleteTemplate}
            />

            <PlatformPreview
              platform={selectedPlatform}
              mode={mode}
              text={displayText}
              matches={matches}
              onChange={handleEditorChange}
              ctx={ctx}
              editorRef={editorRef}
              imageUrl={imageUrl}
              imageLoading={imageLoading}
              getTokenLabel={getTokenLabel}
            />

            <div className={styles.metaRow}>
              <CharCounter count={charCount} limit={charLimit} />
              {selectedPlatform === "x" && !parseTweet && (
                <span className={styles.charCounter}>
                  <Spinner size={12} />
                </span>
              )}
              {mode === "plain" ? (
                <button
                  type="button"
                  className={styles.modeToggle}
                  onClick={handleEnterTemplateMode}
                >
                  <FaPenToSquare aria-hidden="true" />
                  <Trans>Open template editor</Trans>
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.modeToggle}
                  onClick={handleExitTemplateMode}
                >
                  <FaArrowLeft aria-hidden="true" />
                  <Trans>Back to plain text</Trans>
                </button>
              )}
            </div>

            {mode === "template" && (
              <TemplatePicker
                insertableTokens={insertableTokens}
                onInsertVariable={handleInsertVariable}
              />
            )}
          </div>

          {mode === "template" ? (
            <div className={styles.actions}>
              <Input
                id="social-template-name"
                name="social-template-name"
                type="text"
                className={styles.templateNameInput}
                placeholder={_(msg`Template name`)}
                value={templateName}
                onChange={(e) => setTemplateName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveTemplate();
                }}
              />
              <Button
                variant="solid"
                size="md"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim() || !currentBody.trim()}
              >
                <FaFloppyDisk />
                <Trans>Save</Trans>
              </Button>
            </div>
          ) : (
            <div className={styles.actions}>
              <ConfirmableButton
                icon={<FaDownload />}
                label={<Trans>Download image</Trans>}
                confirmLabel={<Trans>Downloaded!</Trans>}
                onAction={handleDownload}
                disabled={!imageBlob}
              />
              <ConfirmableButton
                icon={<FaCopy />}
                label={<Trans>Copy image</Trans>}
                confirmLabel={<Trans>Copied!</Trans>}
                onAction={handleCopyImage}
                disabled={!imageBlob}
              />
              <Button
                variant="solid"
                size="md"
                onClick={handlePost}
                disabled={!canPost}
              >
                {selectedPlatform === "x" ? <FaXTwitter /> : <FaBluesky />}
                <Trans>Post</Trans>
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={pendingTemplateId !== null}
        onClose={handleCancelTemplateSwitch}
        title={_(msg`Switch template?`)}
        description={_(
          msg`Switching templates will replace what you've typed. Continue?`,
        )}
        onConfirm={handleConfirmTemplateSwitch}
        onCancel={handleCancelTemplateSwitch}
      />
    </div>
  );
};

export default SocialPostComposer;
