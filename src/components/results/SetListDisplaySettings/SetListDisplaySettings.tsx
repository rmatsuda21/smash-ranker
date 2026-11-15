import { useRef, useState } from "react";
import {
  FaArrowRightArrowLeft,
  FaBars,
  FaSliders,
  FaTableList,
} from "react-icons/fa6";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { type MessageDescriptor } from "@lingui/core";
import { useLingui } from "@lingui/react";
import cn from "classnames";

import { Popover } from "@/components/shared/Popover/Popover";
import { useResultsStore } from "@/store/resultsStore";
import {
  SET_LIST_LAYOUTS,
  SET_LIST_STYLES,
  type SetListLayout,
  type SetListStyle,
} from "@/types/results/SetListDisplay";
import { TooltipButton } from "@/components/shared/Tooltip/TooltipButton";

import styles from "./SetListDisplaySettings.module.scss";

const LAYOUT_META: Record<
  SetListLayout,
  { label: MessageDescriptor; hint: MessageDescriptor; icon: React.ReactNode }
> = {
  versus: {
    label: msg`Versus`,
    hint: msg`Both players side by side, score in the middle`,
    icon: <FaArrowRightArrowLeft />,
  },
  bracket: {
    label: msg`Bracket`,
    hint: msg`One line per player, like a bracket match box`,
    icon: <FaTableList />,
  },
  compact: {
    label: msg`Compact`,
    hint: msg`One line per set, tap a set for details`,
    icon: <FaBars />,
  },
};

const STYLE_META: Record<SetListStyle, { label: MessageDescriptor }> = {
  default: { label: msg`Default` },
  borderedDots: { label: msg`Dotted` },
  scoreline: { label: msg`Scoreline` },
  gradientEdge: { label: msg`Gradient edge` },
};

const STYLE_SWATCH_CLASS: Record<SetListStyle, string> = {
  default: styles.swatchDefault,
  borderedDots: styles.swatchDots,
  scoreline: styles.swatchScoreline,
  gradientEdge: styles.swatchGradient,
};

export const SetListDisplaySettings = () => {
  const { _ } = useLingui();
  const layout = useResultsStore((s) => s.setListLayout);
  const style = useResultsStore((s) => s.setListStyle);
  const dispatch = useResultsStore((s) => s.dispatch);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <TooltipButton
        ref={anchorRef}
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={_(msg`Display options`)}
        tooltip={_(msg`Display options`)}
        tooltipIsLabel
        onClick={() => setOpen((v) => !v)}
      >
        <FaSliders />
        <span className={styles.triggerLabel}>
          <Trans>Display</Trans>
        </span>
      </TooltipButton>

      <Popover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom-end"
        minWidth={260}
      >
        <div className={styles.panel}>
          <div className={styles.section}>
            <div className={styles.sectionLabel} id="set-list-layout-label">
              <Trans>Layout</Trans>
            </div>
            <div
              className={styles.layoutGroup}
              role="radiogroup"
              aria-labelledby="set-list-layout-label"
            >
              {SET_LIST_LAYOUTS.map((value) => {
                const meta = LAYOUT_META[value];
                const active = value === layout;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={cn(styles.layoutOption, {
                      [styles.active]: active,
                    })}
                    onClick={() =>
                      dispatch({ type: "SET_LIST_LAYOUT", payload: value })
                    }
                  >
                    <span className={styles.layoutIcon}>{meta.icon}</span>
                    <span className={styles.layoutText}>
                      <span className={styles.layoutName}>{_(meta.label)}</span>
                      <span className={styles.layoutHint}>{_(meta.hint)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel} id="set-list-style-label">
              <Trans>Card style</Trans>
            </div>
            <div
              className={styles.styleGroup}
              role="radiogroup"
              aria-labelledby="set-list-style-label"
            >
              {SET_LIST_STYLES.map((value) => {
                const active = value === style;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={cn(styles.styleOption, {
                      [styles.active]: active,
                    })}
                    onClick={() =>
                      dispatch({ type: "SET_LIST_STYLE", payload: value })
                    }
                  >
                    <span
                      className={cn(styles.swatch, STYLE_SWATCH_CLASS[value])}
                      aria-hidden="true"
                    />
                    <span className={styles.styleName}>
                      {_(STYLE_META[value].label)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Popover>
    </>
  );
};
