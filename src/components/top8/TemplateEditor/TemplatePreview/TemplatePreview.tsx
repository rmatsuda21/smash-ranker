import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";
import { FaRegStar, FaStar, FaTrash } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { DBTemplate } from "@/types/Repository";
import { RenderProfileContext } from "@/components/top8/Canvas/RenderProfileContext";
import { StaticScene } from "@/components/top8/Canvas/scene/StaticScene";
import { createSamplePlayers } from "@/utils/top8/samplePlayers";
import { SAMPLE_TOURNAMENT } from "@/utils/top8/sampleTournament";
import { getEffectiveCanvasSize, getUnusedIconSpace } from "@/utils/top8/scene";
import {
  OFFSCREEN_PROFILE,
  getDeviceRenderProfile,
} from "@/utils/top8/renderProfile";
import { previewCache } from "@/db/previewCache";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useEditorStore } from "@/store/editorStore";
import { useFontStore } from "@/store/fontStore";
import { loadFamily } from "@/utils/fonts/fontLoader";
import { collectDesignFontWeights } from "@/utils/fonts/designWeights";
import { defaultPreviews } from "@assets/previews";

import styles from "./TemplatePreview.module.scss";

// Sequential render queue — only one RenderedPreview mounts its Konva Stage at a time
let currentRender: Promise<void> = Promise.resolve();
const requestRenderSlot = (): {
  promise: Promise<void>;
  release: () => void;
} => {
  let release: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const promise = currentRender;
  currentRender = currentRender.then(() => gate);
  return { promise, release: release! };
};

type Props = {
  template: DBTemplate;
  onClick: () => void;
  onDelete?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  className?: string;
  isLoading?: boolean;
};

const samplePlayers = createSamplePlayers(20);

const sampleTournament = SAMPLE_TOURNAMENT;

// One template: the thumbnail is the button that loads it, with the name
// (plus the favorite star, and Delete for the user's own templates)
// underneath.
const PreviewShell = ({
  template,
  onClick,
  onDelete,
  isFavorite = false,
  onToggleFavorite,
  className,
  isLoading,
  offscreen,
  children,
}: Props & {
  children: React.ReactNode;
  /** Rendered outside the button: the hidden stage a preview is drawn on. */
  offscreen?: React.ReactNode;
}) => {
  const { _ } = useLingui();

  return (
    <div className={cn(styles.preview, className)}>
      <button
        type="button"
        className={styles.thumb}
        onClick={onClick}
        aria-label={_(msg`Load template: ${template.name}`)}
      >
        {children}

        {isLoading && (
          <span className={styles.loadingOverlay}>
            <Spinner size={32} />
          </span>
        )}
      </button>
      {offscreen}

      <div className={styles.caption}>
        <span className={styles.name} title={template.name}>
          {template.name}
        </span>
        {onToggleFavorite && (
          <button
            type="button"
            className={cn(styles.captionButton, styles.favoriteButton, {
              [styles.favorited]: isFavorite,
            })}
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={
              isFavorite
                ? _(msg`Remove from favorites: ${template.name}`)
                : _(msg`Add to favorites: ${template.name}`)
            }
          >
            {isFavorite ? <FaStar size={12} /> : <FaRegStar size={12} />}
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className={cn(styles.captionButton, styles.deleteButton)}
            onClick={onDelete}
            aria-label={_(msg`Delete template: ${template.name}`)}
          >
            <FaTrash size={11} />
          </button>
        )}
      </div>
    </div>
  );
};

const CachedPreview = ({ blob, ...props }: Props & { blob: Blob }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return (
    <PreviewShell {...props}>
      {src ? (
        <img src={src} alt="Template preview" className={styles.previewImage} />
      ) : (
        <span className={styles.loading}>
          <Spinner size={32} />
        </span>
      )}
    </PreviewShell>
  );
};

const RenderedPreview = (props: Props) => {
  const { template } = props;
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [stageCaptured, setStageCaptured] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [hasSlot, setHasSlot] = useState(false);
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  const stageRef = useRef<KonvaStage>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const catalogFetching = useFontStore((state) => state.fetching);

  // Load the template's font before rendering
  useEffect(() => {
    if (!template.font) {
      setIsFontLoaded(true);
      return;
    }
    let cancelled = false;
    setIsFontLoaded(false);
    loadFamily(template.font, collectDesignFontWeights(template.design))
      .then(() => {
        if (!cancelled) setIsFontLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setIsFontLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [template.font, template.design, catalogFetching]);

  // Wait for render slot before mounting the Konva stage (after font is loaded)
  useEffect(() => {
    if (!isFontLoaded) return;

    const { promise, release } = requestRenderSlot();
    releaseRef.current = release;

    let cancelled = false;
    promise.then(() => {
      if (!cancelled) setHasSlot(true);
    });

    return () => {
      cancelled = true;
      release();
    };
  }, [isFontLoaded]);

  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);

  const captureImage = useCallback(() => {
    // TODO: Stop using timeout here and find a more reliable solution
    if (!stageRef.current) {
      setTimeout(() => {
        captureImage();
      }, 1500);
      return;
    }

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 1 });
      canvas.toBlob(
        (blob) => {
          canvas.width = 0;
          canvas.height = 0;

          if (blob) {
            const url = URL.createObjectURL(blob);
            setImageDataUrl(url);

            previewCache.set(template.id, blob).catch(() => {
              // Cache write failed — non-critical
            });
          }

          setIsRendering(false);
          setStageCaptured(true);
          releaseRef.current?.();
        },
        "image/webp",
        0.5,
      );
    } catch (error) {
      console.error("Failed to capture canvas:", error);
      setIsRendering(false);
      setStageCaptured(true);
      releaseRef.current?.();
    }
  }, [template.id]);

  useEffect(() => {
    if (isSceneReady) {
      captureImage();
    }
  }, [isSceneReady, captureImage]);

  useEffect(() => {
    return () => {
      if (imageDataUrl) {
        URL.revokeObjectURL(imageDataUrl);
      }
    };
  }, [imageDataUrl]);

  // The sample tournament has no icon, so a design that reserves space for
  // one renders shorter than its stored canvas size.
  const stageSize = getEffectiveCanvasSize(
    template.design,
    samplePlayers,
    template.font,
    getUnusedIconSpace(
      template.design.tournamentIconSpace,
      sampleTournament.iconSrc,
    ),
  );

  return (
    <PreviewShell
      {...props}
      offscreen={
        hasSlot &&
        !stageCaptured && (
          <div className={styles.hiddenStage}>
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              listening={false}
              pixelRatio={1}
            >
              <RenderProfileContext value={OFFSCREEN_PROFILE}>
                <Layer listening={false}>
                  <StaticScene
                    design={template.design}
                    players={samplePlayers}
                    tournament={sampleTournament}
                    fontFamily={template.font}
                    onReady={handleSceneReady}
                  />
                </Layer>
              </RenderProfileContext>
            </Stage>
          </div>
        )
      }
    >
      {isRendering && (
        <span className={styles.loading}>
          <Spinner size={32} />
        </span>
      )}

      {imageDataUrl && (
        <img
          src={imageDataUrl}
          alt="Template preview"
          className={styles.previewImage}
        />
      )}

      {!imageDataUrl && !isRendering && (
        <span className={styles.error}>Failed to load preview</span>
      )}
    </PreviewShell>
  );
};

export const TemplatePreview = (props: Props) => {
  const { template } = props;

  const staticSrc = defaultPreviews[template.id];
  if (staticSrc) {
    return (
      <PreviewShell {...props}>
        <img
          src={staticSrc}
          alt="Template preview"
          className={styles.previewImage}
        />
      </PreviewShell>
    );
  }

  return <UserTemplatePreview {...props} />;
};

const UserTemplatePreview = (props: Props) => {
  const { template } = props;
  const [cachedBlob, setCachedBlob] = useState<Blob | null | undefined>(
    template.previewImage ?? undefined,
  );
  const cacheVersion = useEditorStore((s) => s.previewCacheVersion);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCachedBlob(null);
  }, [cacheVersion]);

  useEffect(() => {
    if (template.previewImage) {
      setCachedBlob(template.previewImage);
      return;
    }

    let cancelled = false;
    previewCache
      .get(template.id)
      .then((blob) => {
        if (!cancelled) {
          setCachedBlob(blob ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCachedBlob(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [template.id, template.previewImage]);

  if (cachedBlob === undefined) {
    return (
      <PreviewShell {...props}>
        <span className={styles.loading}>
          <Spinner size={32} />
        </span>
      </PreviewShell>
    );
  }

  if (cachedBlob) {
    return <CachedPreview {...props} blob={cachedBlob} />;
  }

  if (!getDeviceRenderProfile().renderTemplatePreviews) {
    return (
      <PreviewShell {...props}>
        <span className={styles.placeholder} />
      </PreviewShell>
    );
  }

  return <RenderedPreview {...props} />;
};
