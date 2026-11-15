import { useEffect, useCallback, useRef, lazy, Suspense } from "react";
import cn from "classnames";
import { FaCheck, FaCompress, FaExpand } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";
import { isMobile } from "@/utils/isMobile";
import { getDeviceRenderProfile } from "@/utils/top8/renderProfile";
import { useEditorStore } from "@/store/editorStore";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { SidePanel } from "@/components/top8/SidePanel/SidePanel";
import { Header } from "@/components/top8/Ranker/Header/Header";
import { BracketLoader } from "@/components/shared/BracketLoader/BracketLoader";

import styles from "./Ranker.module.scss";

const Canvas = lazy(() =>
  import("@/components/top8/Canvas/Canvas").then((module) => ({
    default: module.Canvas,
  })),
);

const MobileCanvas = lazy(() =>
  import("@/components/top8/Canvas/MobileCanvas/MobileCanvas").then(
    (module) => ({
      default: module.MobileCanvas,
    }),
  ),
);

export const Ranker = () => {
  const { _ } = useLingui();
  const isCanvasExpanded = useEditorStore((s) => s.isCanvasExpanded);
  const dispatch = useEditorStore((s) => s.dispatch);
  // Layout (narrow screen) and canvas capability are separate questions.
  const mobile = isMobile();
  const { interactive } = getDeviceRenderProfile();

  const bodyRef = useRef<HTMLDivElement>(null);
  const isTyping = useVirtualKeyboard(bodyRef, mobile);
  const canvasSize = useEffectiveCanvasSize();

  const toggleCanvas = useCallback(() => {
    dispatch({ type: "TOGGLE_CANVAS_EXPANDED" });
  }, [dispatch]);

  const dismissKeyboard = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  useEffect(() => {
    preloadCharacterImages();
  }, []);

  const isPreviewExpanded = mobile && isCanvasExpanded && !isTyping;

  return (
    <div
      className={styles.root}
      data-keyboard={isTyping ? "open" : undefined}
      data-preview={isPreviewExpanded ? "expanded" : undefined}
      style={
        canvasSize.width && canvasSize.height
          ? ({
              "--canvas-aspect": canvasSize.width / canvasSize.height,
            } as React.CSSProperties)
          : undefined
      }
    >
      <Header />
      <div ref={bodyRef} className={styles.body}>
        <SidePanel className={styles.sidePanel} />
        <div className={styles.canvasWrapper}>
          <Suspense
            fallback={
              <div className={cn(styles.canvas, styles.canvasFallback)}>
                <BracketLoader />
              </div>
            }
          >
            {interactive ? (
              <Canvas className={styles.canvas} />
            ) : (
              <MobileCanvas className={styles.canvas} />
            )}
          </Suspense>
          {mobile &&
            (isTyping ? (
              // Blurring the field is what closes the keyboard.
              <button
                type="button"
                className={cn(styles.previewAction, styles.done)}
                onClick={dismissKeyboard}
              >
                <FaCheck aria-hidden="true" />
                <Trans>Done</Trans>
              </button>
            ) : (
              <button
                type="button"
                className={styles.previewAction}
                onClick={toggleCanvas}
                aria-pressed={isCanvasExpanded}
                aria-label={
                  isCanvasExpanded
                    ? _(msg`Shrink preview`)
                    : _(msg`Enlarge preview`)
                }
              >
                {isCanvasExpanded ? (
                  <FaCompress aria-hidden="true" />
                ) : (
                  <FaExpand aria-hidden="true" />
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
