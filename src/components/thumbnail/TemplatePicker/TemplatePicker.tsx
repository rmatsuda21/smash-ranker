import { useLayoutEffect, useRef } from "react";
import cn from "classnames";
import { useLingui } from "@lingui/react";

import { useThumbnailStore } from "@/store/thumbnailStore";
import type { ThumbnailTemplateId } from "@/types/thumbnail/Thumbnail";
import { logEvent } from "@/utils/observability/log";
import { drawThumbnail } from "@/utils/thumbnail/drawThumbnail";
import type {
  ThumbnailAssets,
  ThumbnailScene,
} from "@/utils/thumbnail/painter";
import {
  THUMBNAIL_TEMPLATES,
  type ThumbnailTemplate,
} from "@/utils/thumbnail/templates";

import styles from "./TemplatePicker.module.scss";

type Props = {
  scene: ThumbnailScene;
  assets: ThumbnailAssets;
  // "row" is the strip under the preview; "grid" fills a phone's tab.
  layout: "row" | "grid";
};

const PICTURE_WIDTH = 320;

type OptionProps = Omit<Props, "layout"> & {
  template: ThumbnailTemplate;
  selected: boolean;
  onSelect: (id: ThumbnailTemplateId) => void;
};

// A template shown as the current match drawn in it.
const TemplateOption = ({
  template,
  scene,
  assets,
  selected,
  onSelect,
}: OptionProps) => {
  const { _ } = useLingui();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    drawThumbnail(
      canvasRef.current,
      { ...scene, look: { ...scene.look, templateId: template.id } },
      assets,
    );
  }, [scene, assets, template.id]);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(styles.option, selected && styles.selected)}
      onClick={() => onSelect(template.id)}
    >
      <canvas
        ref={canvasRef}
        className={styles.picture}
        width={PICTURE_WIDTH}
        height={(PICTURE_WIDTH * 9) / 16}
        aria-hidden="true"
      />
      <span className={styles.name}>{_(template.label)}</span>
    </button>
  );
};

export const TemplatePicker = ({ scene, assets, layout }: Props) => {
  const updateLook = useThumbnailStore((s) => s.updateLook);

  const handleSelect = (id: ThumbnailTemplateId) => {
    if (id === scene.look.templateId) return;
    updateLook({ templateId: id }, "");
    logEvent("template_select", { surface: "thumbnail", template_id: id });
  };

  return (
    <div className={cn(styles.root, styles[layout])} role="radiogroup">
      {THUMBNAIL_TEMPLATES.map((template) => (
        <TemplateOption
          key={template.id}
          template={template}
          scene={scene}
          assets={assets}
          selected={template.id === scene.look.templateId}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};
