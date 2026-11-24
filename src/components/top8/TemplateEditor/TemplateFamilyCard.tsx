import { useState } from "react";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { DBTemplate } from "@/types/Repository";
import { TemplatePreview } from "@/components/top8/TemplateEditor/TemplatePreview/TemplatePreview";

import styles from "./TemplateEditor.module.scss";

// A built-in variant with its names in the user's language.
export type FamilyVariant = DBTemplate & {
  /** What the variant's pill says. */
  label: string;
  swatch?: [string, string];
};

type Props = {
  name: string;
  /** The variants the current filter lets through, in catalog order. */
  variants: FamilyVariant[];
  /** The family has variants beyond the ones shown. */
  hasHiddenVariants: boolean;
  activeTemplateId?: string;
  favoriteIds: string[];
  onLoad: (templateId: string) => void;
  onToggleFavorite: (templateId: string) => void;
  loadingTemplateId: string | null;
};

// One built-in template with all its variants behind one thumbnail. Picking
// a swatch or a pill only changes which variant the card shows; the
// thumbnail loads it.
export const TemplateFamilyCard = ({
  name,
  variants,
  hasHiddenVariants,
  activeTemplateId,
  favoriteIds,
  onLoad,
  onToggleFavorite,
  loadingTemplateId,
}: Props) => {
  const { _ } = useLingui();
  const [pickedId, setPickedId] = useState<string | null>(null);

  // The user's pick, else the variant in use, else the first one.
  const shown =
    variants.find((variant) => variant.id === pickedId) ??
    variants.find((variant) => variant.id === activeTemplateId) ??
    variants[0];
  if (!shown) return null;

  const isOneOfSeveral = variants.length > 1 || hasHiddenVariants;

  return (
    <TemplatePreview
      template={{
        ...shown,
        name: isOneOfSeveral ? `${name} · ${shown.name}` : name,
      }}
      displayName={name}
      isActive={shown.id === activeTemplateId}
      onClick={() => onLoad(shown.id)}
      isFavorite={favoriteIds.includes(shown.id)}
      onToggleFavorite={() => onToggleFavorite(shown.id)}
      isLoading={loadingTemplateId === shown.id}
      footer={
        isOneOfSeveral && (
          <div
            className={styles.variants}
            role="group"
            aria-label={_(msg`${name} variants`)}
          >
            {variants.map((variant) => {
              const isShown = variant.id === shown.id;

              return variant.swatch ? (
                <button
                  key={variant.id}
                  type="button"
                  className={cn(styles.swatch, {
                    [styles.shown]: isShown,
                  })}
                  style={{
                    background: `linear-gradient(135deg, ${variant.swatch[0]} 50%, ${variant.swatch[1]} 50%)`,
                  }}
                  aria-label={variant.name}
                  aria-pressed={isShown}
                  title={variant.name}
                  onClick={() => setPickedId(variant.id)}
                />
              ) : (
                <button
                  key={variant.id}
                  type="button"
                  className={cn(styles.pill, {
                    [styles.shown]: isShown,
                  })}
                  aria-label={variant.name}
                  aria-pressed={isShown}
                  title={variant.name}
                  onClick={() => setPickedId(variant.id)}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>
        )
      }
    />
  );
};
