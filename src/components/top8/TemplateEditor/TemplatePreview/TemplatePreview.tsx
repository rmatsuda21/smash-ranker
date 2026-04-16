import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Group } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";
import { FaTrash } from "react-icons/fa6";

import { DBTemplate } from "@/types/Repository";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { createSamplePlayers } from "@/utils/top8/samplePlayers";
import { TournamentInfo } from "@/types/top8/Tournament";
import { useTooltip } from "@/hooks/top8/useTooltip";
import { isMobile } from "@/utils/isMobile";
import { previewCache } from "@/db/previewCache";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useEditorStore } from "@/store/editorStore";
import { defaultPreviews } from "@assets/previews";

import styles from "./TemplatePreview.module.scss";

// Sequential render queue — only one RenderedPreview mounts its Konva Stage at a time
let currentRender: Promise<void> = Promise.resolve();
const requestRenderSlot = (): { promise: Promise<void>; release: () => void } => {
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
  className?: string;
  isLoading?: boolean;
};

const samplePlayers = createSamplePlayers(20);

const sampleTournament: TournamentInfo = {
  tournamentName: "Some Tournament",
  eventName: "Some Event",
  date: new Date(1999, 10, 7).toISOString(),
  location: {
    city: "College Station",
    state: "TX",
    country: "US",
  },
  entrants: 69,
  url: "https://start.gg/420-69-tournament",
};

const PreviewShell = ({
  template,
  onClick,
  onDelete,
  className,
  isLoading,
  children,
}: Props & { children: React.ReactNode }) => {
  const { Tooltip, handleMouseEnter, handleMouseLeave } = useTooltip({
    tooltip: template.name,
  });

  return (
    <div
      className={cn(styles.previewContainer, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <Spinner size={32} />
        </div>
      )}

      {onDelete && (
        <button
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete template"
        >
          <FaTrash size={12} />
        </button>
      )}

      {Tooltip && <Tooltip className={styles.tooltip} />}
    </div>
  );
};

const CachedPreview = ({
  blob,
  ...props
}: Props & { blob: Blob }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return (
    <PreviewShell {...props}>
      {src ? (
        <img
          src={src}
          alt="Template preview"
          className={styles.previewImage}
        />
      ) : (
        <div className={styles.loading}>
          <Spinner size={32} />
        </div>
      )}
    </PreviewShell>
  );
};

const RenderedPreview = (props: Props) => {
  const { template } = props;
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [stageCaptured, setStageCaptured] = useState(false);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const [isTournamentReady, setIsTournamentReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [hasSlot, setHasSlot] = useState(false);

  const mobile = isMobile();
  const stageRef = useRef<KonvaStage>(null);
  const releaseRef = useRef<(() => void) | null>(null);

  // Wait for render slot before mounting the Konva stage
  useEffect(() => {
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
  }, []);

  const backgroundElements = useMemo(
    () =>
      createKonvaElements(
        template.design.background.elements,
        {
          containerSize: template.design.canvasSize,
          design: {
            colorPalette: template.design.colorPalette,
            bgAssetId: template.design.bgAssetId,
            bgImageDarkness: template.design.bgImageDarkness,
          },
          perfectDraw: false,
          options: {
            disableSelectable: true,
          },
        },
        { onAllReady: () => setIsBackgroundReady(true) }
      ),
    [
      template.design.background.elements,
      template.design.colorPalette,
      template.design.bgAssetId,
      template.design.bgImageDarkness,
      template.design.canvasSize,
    ]
  );

  const tournamentElements = useMemo(
    () =>
      createKonvaElements(
        template.design.tournament?.elements ?? [],
        {
          tournament: sampleTournament,
          containerSize: template.design.canvasSize,
          design: {
            colorPalette: template.design.colorPalette,
            textPalette: template.design.textPalette,
            bgAssetId: template.design.bgAssetId,
            bgImageDarkness: template.design.bgImageDarkness,
          },
          perfectDraw: false,
          options: { disableSelectable: true },
        },
        { onAllReady: () => setIsTournamentReady(true) }
      ),
    [
      template.design.tournament?.elements,
      template.design.colorPalette,
      template.design.textPalette,
      template.design.bgAssetId,
      template.design.bgImageDarkness,
      template.design.canvasSize,
    ]
  );

  const playerElements = useMemo(() => {
    const actualPlayerCount = Math.min(
      samplePlayers.length,
      template.design.players.length
    );
    let readyCount = 0;

    const indices = samplePlayers.map((_, i) => i);
    const renderOrder = template.design.reversePlayerZOrder
      ? [...indices].reverse()
      : indices;

    return renderOrder.map((index) => {
      const player = samplePlayers[index];
      if (!player || index >= template.design.players.length) return null;

      const playerDesign = {
        ...template.design.basePlayer,
        ...template.design.players[index],
      };

      const elements = createKonvaElements(
        playerDesign.elements ?? [],
        {
          player,
          containerSize: {
            width: playerDesign.size?.width,
            height: playerDesign.size?.height,
          },
          design: {
            colorPalette: template.design.colorPalette,
            bgAssetId: template.design.bgAssetId,
            bgImageDarkness: template.design.bgImageDarkness,
          },
          perfectDraw: false,
          options: { disableSelectable: true },
        },
        {
          onAllReady: () => {
            readyCount++;
            if (readyCount === actualPlayerCount) {
              setIsPlayerReady(true);
            }
          },
        }
      );

      return (
        <Group
          key={player.id}
          x={playerDesign.position?.x}
          y={playerDesign.position?.y}
          width={playerDesign.size?.width}
          height={playerDesign.size?.height}
          scaleX={playerDesign.scale?.x}
          scaleY={playerDesign.scale?.y}
          rotation={playerDesign.rotation ?? 0}
        >
          {elements}
        </Group>
      );
    });
  }, [
    template.design.basePlayer,
    template.design.players,
    template.design.colorPalette,
    template.design.bgAssetId,
    template.design.bgImageDarkness,
  ]);

  const captureImage = useCallback(() => {
    // TODO: Stop using timeout here and find a more reliable solution
    if (!stageRef.current) {
      setTimeout(() => {
        captureImage();
      }, 1500);
      return;
    }

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: mobile ? 0.25 : 1 });
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
        0.5
      );
    } catch (error) {
      console.error("Failed to capture canvas:", error);
      setIsRendering(false);
      setStageCaptured(true);
      releaseRef.current?.();
    }
  }, [template.id, mobile]);

  useEffect(() => {
    if (isBackgroundReady && isTournamentReady && isPlayerReady) {
      captureImage();
    }
  }, [isBackgroundReady, isTournamentReady, isPlayerReady, captureImage]);

  useEffect(() => {
    return () => {
      if (imageDataUrl) {
        URL.revokeObjectURL(imageDataUrl);
      }
    };
  }, [imageDataUrl]);

  return (
    <PreviewShell {...props}>
      {hasSlot && !stageCaptured && (
        <div className={styles.hiddenStage}>
          <Stage
            ref={stageRef}
            width={template.design.canvasSize.width}
            height={template.design.canvasSize.height}
            listening={false}
            pixelRatio={mobile ? 0.25 : 1}
          >
            <Layer listening={false}>{backgroundElements}</Layer>
            <Layer listening={false}>{playerElements}</Layer>
            <Layer listening={false}>{tournamentElements}</Layer>
          </Stage>
        </div>
      )}

      {isRendering && (
        <div className={styles.loading}>
          <Spinner size={32} />
        </div>
      )}

      {imageDataUrl && (
        <img
          src={imageDataUrl}
          alt="Template preview"
          className={styles.previewImage}
        />
      )}

      {!imageDataUrl && !isRendering && (
        <div className={styles.error}>Failed to load preview</div>
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
    template.previewImage ?? undefined
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
    previewCache.get(template.id).then((blob) => {
      if (!cancelled) {
        setCachedBlob(blob ?? null);
      }
    }).catch(() => {
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
        <div className={styles.loading}>
          <Spinner size={32} />
        </div>
      </PreviewShell>
    );
  }

  if (cachedBlob) {
    return <CachedPreview {...props} blob={cachedBlob} />;
  }

  if (isMobile()) {
    return (
      <PreviewShell {...props}>
        <div className={styles.placeholder}>{template.name}</div>
      </PreviewShell>
    );
  }

  return <RenderedPreview {...props} />;
};
