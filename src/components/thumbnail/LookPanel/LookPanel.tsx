import { useId, useRef } from "react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { FaArrowRightArrowLeft } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { ColorInput } from "@/components/shared/ColorInput/ColorInput";
import { Input } from "@/components/shared/Input/Input";
import { TextFontSelect } from "@/components/shared/TextFontSelect/TextFontSelect";
import { useToast } from "@/components/Toast/useToast";
import { useThumbnailStore } from "@/store/thumbnailStore";
import { readLogoFile } from "@/utils/thumbnail/readLogoFile";

import styles from "./LookPanel.module.scss";

// The lettering is drawn at the heaviest weight a font has.
const FONT_WEIGHTS = [900];

// Everything that stays the same across an event's thumbnails: colours,
// the event's name, the logo and the font.
export const LookPanel = () => {
  const { _ } = useLingui();
  const id = useId();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const look = useThumbnailStore((s) => s.look);
  const eventIcon = useThumbnailStore((s) => s.event?.iconUrl || null);
  const updateLook = useThumbnailStore((s) => s.updateLook);

  const logo = look.logo ?? eventIcon;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    const dataUrl = await readLogoFile(file);
    if (dataUrl) updateLook({ logo: dataUrl }, "");
    else
      showToast(_(msg`That file could not be read as an image.`), {
        variant: "error",
      });
  };

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h3 className={styles.heading}>
          <Trans>Colours</Trans>
        </h3>
        <div className={styles.colours}>
          <div className={styles.colour}>
            <ColorInput
              color={look.left}
              onChange={(left) => updateLook({ left }, "left")}
            />
            <span>
              <Trans>Left</Trans>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            tooltip={_(msg`Swap colours`)}
            onClick={() =>
              updateLook({ left: look.right, right: look.left }, "")
            }
          >
            <FaArrowRightArrowLeft />
          </Button>
          <div className={styles.colour}>
            <ColorInput
              color={look.right}
              onChange={(right) => updateLook({ right }, "right")}
            />
            <span>
              <Trans>Right</Trans>
            </span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <Input
          id={`${id}-event`}
          label={_(msg`Event name`)}
          value={look.eventText}
          autoComplete="off"
          onChange={(e) =>
            updateLook({ eventText: e.currentTarget.value }, "event")
          }
        />
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>
          <Trans>Logo</Trans>
        </h3>
        <div className={styles.logoRow}>
          <div className={styles.logo}>{logo && <img src={logo} alt="" />}</div>
          <div className={styles.logoActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              {look.logo ? (
                <Trans>Replace</Trans>
              ) : (
                <Trans>Upload a logo</Trans>
              )}
            </Button>
            {look.logo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateLook({ logo: null }, "")}
              >
                <Trans>Remove</Trans>
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            className={styles.file}
            type="file"
            accept="image/*"
            aria-label={_(msg`Logo image`)}
            onChange={handleFile}
          />
        </div>
        {!look.logo && eventIcon && (
          <p className={styles.note}>
            <Trans>Using the tournament's icon.</Trans>
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>
          <Trans>Font</Trans>
        </h3>
        <TextFontSelect
          value={look.font}
          weights={FONT_WEIGHTS}
          onChange={(font) => updateLook({ font }, "")}
        />
      </section>
    </div>
  );
};
